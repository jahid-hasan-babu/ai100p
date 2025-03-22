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
  const emailHTML = `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>OTP Verification</title>
  </head>
  <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f6f9fc; margin: 0; padding: 0; line-height: 1.6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
          <div style="background-color: #FF7600; background-image: linear-gradient(135deg, #FF7600, #45a049); padding: 30px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);">OTP Verification</h1>
          </div>
          <div style="padding: 20px 12px; text-align: center;">
              <p style="font-size: 18px; color: #333333; margin-bottom: 10px;">Hello,</p>
              <p style="font-size: 18px; color: #333333; margin-bottom: 20px;">Your OTP for verifying your account is:</p>
              <p style="font-size: 36px; font-weight: bold; color: #FF7600; margin: 20px 0; padding: 10px 20px; background-color: #f0f8f0; border-radius: 8px; display: inline-block; letter-spacing: 5px;">${otp}</p>
              <p style="font-size: 16px; color: #555555; margin-bottom: 20px; max-width: 400px; margin-left: auto; margin-right: auto;">Please provided this OTP to seller for verification.</p>
              <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                  <p style="font-size: 14px; color: #888888; margin-bottom: 4px;">Thank you for choosing our service!</p>
                  <p style="font-size: 14px; color: #888888; margin-bottom: 0;">If you didn't request this OTP, please ignore this email.</p>
              </div>
          </div>
          <div style="background-color: #f9f9f9; padding: 10px; text-align: center; font-size: 12px; color: #999999;">
              <p style="margin: 0;">© 2025 All rights reserved.</p>
          </div>
      </div>
  </body>
  </html>`;

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

  // const userData = await prisma.user.findUnique({
  //   where: { email: payload.email },
  // });

  // if (!userData) {
  //   throw new ApiError(httpStatus.BAD_REQUEST, "User not found");
  // }

  // try {
  //   const notificationData = {
  //     title: "New Booking Request",
  //     body: `A new booking request has been made for ${payload.time}.`,
  //     bookingId: booking.id,
  //     receiverId: existingService.userId, // Notify the service provider
  //     senderId: userId,
  //   };

  //   await notificationServices.sendSingleNotification({
  //     params: { userId: existingService.userId },
  //     body: notificationData,
  //     user: { id: userId },
  //   });
  // } catch (error: any) {
  //   console.error("Failed to send notification:", error.message);
  // }

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
      date: true,
      isPaid: true,
      service: {
        select: {
          id: true,
          serviceImage: true,
          title: true,
          location: true,
          date: true,
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
      isPaid: true,
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
          serviceImage: true,
          title: true,
          date: true,
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
      email: booking?.user.email ?? "",
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
