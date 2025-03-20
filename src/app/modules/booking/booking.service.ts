import prisma from "../../utils/prisma";
import httpStatus from "http-status";
import ApiError from "../../errors/ApiError";
import { IPaginationOptions } from "../../interface/pagination.type";
import { paginationHelper } from "../../../helpers/paginationHelper";
import { searchFilter4 } from "../../utils/searchFilter";
import { StripeServices } from "../payment/payment.service";
import sentEmailUtility from "../../utils/sentEmailUtility";

const requestBooking = async (
  userId: string,
  payload: any,
  serviceId: string
) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });
  const existingService = await prisma.service.findUnique({
    where: { id: serviceId },
    select: { time: true, userId: true },
  });

  if (!existingService) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Service not available");
  }

  // Ensure the time array exists
  if (!Array.isArray(existingService.time)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Time slots are not available for this service"
    );
  }

  const timeSlots = existingService.time as { time: string; status: string }[];

  const slotExists = timeSlots.some(
    (slot) => slot.time === payload.time && slot.status === "available"
  );

  if (!slotExists) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Selected time slot is not available"
    );
  }

  // Create a new booking entry
  const booking = await prisma.booking.create({
    data: {
      userId,
      ...payload,
      serviceId,
    },
  });

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP

  const emailSubject = "OTP Verification";

  // Plain text version
  const emailText = `Your OTP is: ${otp}`;

  // HTML content for the email design
  const emailHTML = `
    <table cellpadding="0" cellspacing="0" align="center" style="width:100%; table-layout:fixed; background-color:#f5f5f5;">
        <tr>
            <td align="center">
                <table cellpadding="0" cellspacing="0" style="background-color:#ffffff; width:600px; border-collapse:collapse;">
                    <tr>
                        <td align="center" style="padding:30px 20px;">
                            <img src="https://i.ibb.co/yVsctTq/file-1.png" alt="Logo" width="200" style="display:block; border:0;"/>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding:10px 20px;">
                            <h3 style="margin:0; font-family:'Arial', sans-serif; font-size:46px; font-weight:bold; color:#333;">
                                Reset Password
                            </h3>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding:5px 40px;">
                            <p style="margin:0; font-family:'Arial', sans-serif; font-size:14px; color:#333;">
                                We received a request to reset your UIPtv Account password.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding:10px 20px;">
                            <table cellpadding="0" cellspacing="0" style="width:100%; border:2px dashed #ccc; border-radius:5px;">
                                <tr>
                                    <td align="center" style="padding:20px;">
                                        <h3 style="margin:0; font-family:'Arial', sans-serif; font-size:26px; font-weight:bold; color:#333;">
                                            Your verification code is:
                                        </h3>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="padding:10px 20px;">
                                        <h1 style="margin:0; font-family:'Arial', sans-serif; font-size:46px; font-weight:bold; color:#5c68e2;">
                                            ${otp}
                                        </h1>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>`;

  // Send email with both plain text and HTML
  if (user && user.email) {
    await sentEmailUtility(user.email, emailSubject, emailText, emailHTML);
  } else {
    throw new ApiError(httpStatus.BAD_REQUEST, "User email not found");
  }

  const existingOtp = await prisma.paymentOtp.findFirst({
    where: { email: user?.email ?? "" },
  });

  if (existingOtp) {
    await prisma.paymentOtp.update({
      where: {
        id: existingOtp.id,
      },
      data: {
        otp: otp as any,
      },
    });
  } else {
    await prisma.paymentOtp.create({
      data: {
        email: user?.email ?? "",
        otp: otp as any,
      },
    });
  }

  const updatedTime = timeSlots.map((slot) =>
    slot.time === payload.time ? { ...slot, status: "booked" } : slot
  );

  // Update the service with modified time array
  await prisma.service.update({
    where: { id: serviceId },
    data: { time: updatedTime },
  });

  return booking;
};

const getMyBookings = async (
  userId: string,
  options: IPaginationOptions & { search?: string }
) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { search } = options;

  const searchFilters = searchFilter4(search as string);
  const bookings = await prisma.booking.findMany({
    where: { ...searchFilters, userId: userId, isPaid: true },
    orderBy: { createdAt: "desc" },
    skip,
    take: limit,
    select: {
      id: true,
      userId: true,
      serviceId: true,
      time: true,
      bookingStatus: true,
      status: true,
      isPaid: true,
      service: {
        select: {
          id: true,
          serviceImage: true,
          title: true,
          location: true,
          user: {
            select: {
              id: true,
              name: true,
              profileImage: true,
            },
          },
        },
      },
    },
  });
  return {
    meta: {
      total: await prisma.booking.count({
        where: { userId: userId, isPaid: true },
      }),
      page,
      limit,
    },
    data: bookings,
  };
};

const getMyBookingAsSeller = async (userId: string) => {
  const result = await prisma.booking.findMany({
    where: {
      isPaid: false,
      service: {
        userId: userId,
      },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      userId: true,
      serviceId: true,
      name: true,
      age: true,
      price: true,
      time: true,
      date: true,
      bookingStatus: true,
      status: true,
      service: {
        select: {
          id: true,
          serviceImage: true,
          title: true,
          location: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          profileImage: true,
          isVerified: true,
        },
      },
    },
  });
  return result;
};

const getMySingleBookingAsSeller = async (id: string) => {
  const result = await prisma.booking.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      userId: true,
      serviceId: true,
      name: true,
      age: true,
      price: true,
      time: true,
      date: true,
      bookingStatus: true,
      status: true,
      service: {
        select: {
          id: true,
          serviceImage: true,
          title: true,
          location: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          profileImage: true,
          isVerified: true,
        },
      },
    },
  });
  return result;
};

const updateBookingStatus = async (
  userId: string,
  id: string,
  payload: any
) => {
  const booking = await prisma.booking.findUnique({
    where: { id: id },
    select: {
      user: {
        select: {
          email: true,
        },
      },
    },
  });

  const otpData = await prisma.paymentOtp.findFirst({
    where: {
      email: payload.email,
    },
  });

  if (otpData?.otp !== payload.otp) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid OTP");
  }

  await prisma.paymentOtp.delete({
    where: {
      id: otpData?.id,
    },
  });

  const result = await prisma.booking.update({
    where: { id },
    data: {
      status: payload.status,
    },
  });

  if (payload.status === "COMPLETED") {
    StripeServices.transferFundsWithStripe(userId, id);
  }

  return;
};

const acceptBooking = async (id: string) => {
  const booking = await prisma.booking.findUnique({
    where: { id },
    select: {
      bookingStatus: true,
      status: true,
    },
  });

  if (!booking) {
    throw new ApiError(httpStatus.NOT_FOUND, "Booking not found");
  }

  const updatedBooking = await prisma.booking.update({
    where: { id },
    data: {
      bookingStatus: "CONFIRMED",
    },
  });

  // Return updated booking
  return acceptBooking;
};

const deliceBooking = async (id: string) => {
  const result = await prisma.booking.findUnique({
    where: {
      id,
    },
    select: {
      paymentIntentId: true,
    },
  });

  if (result?.paymentIntentId) {
    try {
      await StripeServices.refundPaymentToCustomer({
        paymentIntentId: result.paymentIntentId,
      });
      console.log(
        "Refund successfully initiated for paymentIntentId:",
        result.paymentIntentId
      );
    } catch (error: any) {
      console.error("Refund failed:", error.message);
      throw new Error("Refund failed, booking cannot be deleted.");
    }
  }

  const delicedBooking = await prisma.booking.update({
    where: {
      id,
    },
    data: {
      status: "CANCELLED",
    },
  });

  return delicedBooking;
};

export const BookingServices = {
  requestBooking,
  getMyBookings,
  getMyBookingAsSeller,
  getMySingleBookingAsSeller,
  acceptBooking,
  deliceBooking,
  updateBookingStatus,
};
