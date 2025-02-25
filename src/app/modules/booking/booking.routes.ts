import express from "express";
import auth from "../../middlewares/auth";
import { BookingControllers } from "./booking.controller";

const router = express.Router();

router.post("/request-booking", auth(), BookingControllers.requestBooking);

router.get("/my-bookings", auth(), BookingControllers.getMyBookings);

router.get("/my-booking-as-seller", auth(), BookingControllers.getMyBookingAsSeller);

router.get(
  "/my-single-booking-as-seller/:id",
  auth(),
  BookingControllers.getMySingleBookingAsSeller
);

router.post("/accept-booking/:id", auth(), BookingControllers.acceptBooking);

router.post("/delice-booking/:id", auth(), BookingControllers.declineBooking);


export const BookingRouters = router;
