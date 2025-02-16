import { Request, Response } from "express";
import sendResponse from "../../utils/sendResponse";
import catchAsync from "../../utils/catchAsync";
import { PaymentServices } from "./payment.service";

const createPayment = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const payload = req.body;
  const result = await PaymentServices.createPaymentWithSavedCard(
    userId,
    payload
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Stipe payment successful",
    data: result,
  });
});



const capturePayment = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const payload = req.body;
  const result = await PaymentServices.capturePayment(userId, payload);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Stipe payment successful",
    data: result,
  });
});

// Refund payment to customer
const refundPaymentToCustomer = catchAsync(
  async (req: Request, res: Response) => {
    const orderId = req.params.orderId;
    const result = await PaymentServices.refundPayment(orderId);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Refund payment successfully",
      data: result,
    });
  }
);

export const PaymentController = {
  createPayment,
  capturePayment,
  refundPaymentToCustomer,
};
