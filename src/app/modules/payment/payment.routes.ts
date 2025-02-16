import express from "express";
import auth from "../../middlewares/auth";
import { PaymentController } from "./payment.controller";

const router = express.Router();
// Authorize the customer with the amount and send payment request
router.post(
  "/make-payment",
  auth("USER", "ADMIN"),
  // validateRequest(AuthorizedPaymentPayloadSchema),
  PaymentController.createPayment
);

router.post(
  "/capture-payment",
  auth("USER", "ADMIN"),
  PaymentController.capturePayment
);

// Refund payment to customer
router.post(
  "/refund-payment/:orderId",
  auth("USER", "ADMIN"),
  PaymentController.refundPaymentToCustomer
);

export const PaymentRoutes = router;
