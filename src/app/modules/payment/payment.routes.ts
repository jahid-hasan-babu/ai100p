import express from 'express';
import auth from '../../middlewares/auth';
import { UserRoleEnum } from '@prisma/client';
import { PaymentController } from './payment.controller';

const router = express.Router();

import {
  AuthorizedPaymentPayloadSchema,
  capturedPaymentPayloadSchema,
  refundPaymentPayloadSchema,
  saveNewCardWithExistingCustomerPayloadSchema,
  TStripeSaveWithCustomerInfoPayloadSchema,
} from './payment.validation';
import validateRequest from '../../middlewares/validateRequest';
import { stripe } from "../../utils/stripe";

// create a new customer with card
router.post(
  "/save-card",
  auth(),
  validateRequest(TStripeSaveWithCustomerInfoPayloadSchema),
  PaymentController.saveCardWithCustomerInfo
);

// Authorize the customer with the amount and send payment request
router.post(
  "/payment",
  auth(),
  PaymentController.authorizedPaymentWithSaveCard
);

// Capture the payment request and deduct the amount
router.post(
  "/capture-payment",
  validateRequest(capturedPaymentPayloadSchema),
  PaymentController.capturePaymentRequest
);

// Save new card to existing customer
router.post(
  "/save-new-card",
  auth(),
  validateRequest(saveNewCardWithExistingCustomerPayloadSchema),
  PaymentController.saveNewCardWithExistingCustomer
);

// Delete card from customer
router.delete(
  "/delete-card/:paymentMethodId",
  PaymentController.deleteCardFromCustomer
);

// Refund payment to customer
router.post(
  "/refund-payment",
  auth(),
  PaymentController.refundPaymentToCustomer
);

router.post(
  "/transfer-funds/:bookingId",
  auth(),
  PaymentController.transferFundsWithStripe
);

router.get("/my-payment", auth(), PaymentController.myPayment);

router.get("/customers/:customerId", PaymentController.getCustomerDetails);

router.get(
  "/customers",
  auth("ADMIN", UserRoleEnum.SUPERADMIN),
  PaymentController.getAllCustomers
);

router.get(
  "/transactions",
  auth("ADMIN", "SUPERADMIN"),
  PaymentController.transactions
);

router.get("/:customerId", PaymentController.getCustomerSavedCards);





export const PaymentRouters = router;
