import prisma from "../../utils/prisma";
import httpStatus from "http-status";
import ApiError from "../../errors/ApiError";
// import { notificationServices } from "../notifications/notification.service";
// import { StripeServices } from "../payment/payment.service";
// import sentEmailUtility from "../../utils/sentEmailUtility";
// import { generateCode } from "../../utils/generateToken";
import config from "../../../config";
import { Secret } from "jsonwebtoken";
import jwt from "jsonwebtoken";
import { IPaginationOptions } from "../../interface/pagination.type";
import { paginationHelper } from "../../../helpers/paginationHelper";
import {  searchFilter4 } from "../../utils/searchFilter";
import { StripeServices } from "../payment/payment.service";


const requestBooking = async (
  userId: string,
  payload: any,
  serviceId: string
) => {
  
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

  const slotExists = timeSlots.some((slot) => slot.time === payload.time && slot.status === "available");


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
  

// const timeSlots = Array.isArray(existingService.time)
//   ? (existingService.time as { time: string; status: string }[])
//   : [];

const updatedTime = timeSlots.map((slot) =>
  slot.time === payload.time ? { ...slot, status: "booked" } : slot
);

    // Update the service with modified time array
    await prisma.service.update({
      where: { id: serviceId },
      data: { time: updatedTime },
    });

 
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
      total: await prisma.booking.count({ where: { userId: userId, isPaid: true} }),
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
}


const updateBookingStatus = async (id: string, data: any) => {
  const result = await prisma.booking.update({
    where: { id },
    data: {
      status: data.status,
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
      paymentIntentId : true,
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
};
