import httpStatus from "http-status";
import { BookingServices } from "./booking.service";
import sendResponse from "../../utils/sendResponse";
import catchAsync from "../../utils/catchAsync";
import { Request, Response } from "express";

const requestBooking = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const serviceId = req.body.serviceId;
  const payload = req.body;
  const result = await BookingServices.requestBooking(userId, payload, serviceId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Booking created successfully",
    data: result,
  });
});

const getMyBookings = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const options = req.query;
  const result = await BookingServices.getMyBookings(userId, options);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Bookings retrieved successfully",
    data: result,
  });
});

const getMyBookingAsSeller = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const result = await BookingServices.getMyBookingAsSeller(userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Bookings retrieved successfully",
    data: result,
  });
})

const getMySingleBookingAsSeller = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await BookingServices.getMySingleBookingAsSeller(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Bookings retrieved successfully",
    data: result,
  });
})

const acceptBooking = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await BookingServices.acceptBooking(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Booking accepted successfully",
    data: result,
  });
})

const declineBooking = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await BookingServices.deliceBooking(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Booking declined successfully",
    data: result,
  });
})





export const BookingControllers = {
  requestBooking,
  getMyBookings,
  getMyBookingAsSeller,
  getMySingleBookingAsSeller,
  acceptBooking,
  declineBooking,
};
