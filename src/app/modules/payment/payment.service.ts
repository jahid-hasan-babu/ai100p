import httpStatus from "http-status";
import Stripe from "stripe";
import { TStripeSaveWithCustomerInfo } from "./payment.interface";
import prisma from "../../utils/prisma";
import ApiError from "../../errors/ApiError";
import { User } from "@prisma/client";
import sendEmail from "../../utils/sendEmail";

const apiVersion = "2024-12-18.acacia";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion,
});

const saveCardWithCustomerInfoIntoStripe = async (
  payload: TStripeSaveWithCustomerInfo,
  userId: string
) => {
  try {
    const { user, paymentMethodId, address } = payload;
    const customer = await stripe.customers.create({
      name: user.name,
      email: user.email,
      address: {
        city: address.city,
        postal_code: address.postal_code,
        country: address.country,
      },
    });
    const attach = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customer.id,
    });
    const updateCustomer = await stripe.customers.update(customer.id, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        customerId: customer.id,
      },
    });

    return {
      customerId: customer.id,
      paymentMethodId: paymentMethodId,
    };
  } catch (error: any) {
    throw Error(error.message);
  }
};

const authorizedPaymentWithSaveCardFromStripe = async (payload: {
  customerId: string;
  amount: number;
  paymentMethodId: string;
  bookingId: string;
}) => {
  try {
    const { customerId, paymentMethodId, amount, bookingId } = payload;

    const attach = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Total amount in cents
      currency: "usd",
      customer: customerId,
      payment_method: paymentMethodId,
      off_session: true,
      confirm: true,
    });

    console.log(paymentIntent);

    if (paymentIntent.status === "succeeded") {
      // Step 2: Save payment and update booking in the database

      const payment = await prisma.payment.create({
        data: {
          paymentIntentId: paymentIntent.id,
          customerId,
          paymentMethodId,
          amount,
          paymentDate: new Date(),
        },
        select: { id: true },
      });

      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          paymentIntentId: paymentIntent.id,
          isPaid: true,
        },
      });

      return {
        success: true,
        message: "Payment processed successfully",
        data: {
          paymentId: payment.id,
          paymentIntentId: paymentIntent.id,
        },
      };
    } else {
      return {
        success: false,
        message: "PaymentIntent not succeeded",
        status: paymentIntent.status,
      };
    }
  } catch (error: any) {
    // Log the error for debugging
    console.error("Stripe Payment Error:", error.message, error.stack);

    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};

const transferFundsWithStripe = async (userId: string, bookingId: string) => {
  const existingUser = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      accountId: true,
    },
  });

  const existingBooking = await prisma.booking.findUnique({
    where: {
      id: bookingId,
    },
    select: {
      serviceId: true,
      service: {
        select: {
          userId: true,
        },
      },
      price: true,
      paymentIntentId: true,
      status: true,
    },
  });

  const user = await prisma.user.findUniqueOrThrow({
    where: {
      id: existingBooking?.service?.userId ?? "",
    },
    select: {
      email: true,
    },
  });

  await prisma.booking.update({
    where: {
      id: bookingId,
    },
    data: {
      status: "COMPLETED",
    },
  });

  const paymentIntent = await stripe.paymentIntents.retrieve(
    existingBooking?.paymentIntentId ?? ""
  );

  if (paymentIntent.status !== "succeeded") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Payment intent has not been successful."
    );
  }

  const amountReceived = paymentIntent.amount_received;
  if (amountReceived <= 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "No funds available in the payment intent."
    );
  }

  const destinationAccountId = existingUser?.accountId;
  if (!destinationAccountId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "No connected account found for the user."
    );
  }

  const transferAmount = Math.floor(amountReceived * 0.9);

  const transfer = await stripe.transfers.create({
    amount: transferAmount,
    currency: "usd",
    destination: destinationAccountId,
    description: "Transfer to connected account after payment",
  });

  return transfer;
};

const capturePaymentRequestToStripe = async (payload: {
  paymentIntentId: string;
}) => {
  try {
    const { paymentIntentId } = payload;
    const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);

    return paymentIntent;
  } catch (error: any) {
    throw new ApiError(httpStatus.CONFLICT, error.message);
  }
};

const saveNewCardWithExistingCustomerIntoStripe = async (payload: {
  customerId: string;
  paymentMethodId: string;
}) => {
  try {
    const { customerId, paymentMethodId } = payload;

    // Attach the new PaymentMethod to the existing Customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    // Optionally, set the new PaymentMethod as the default
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    return {
      customerId: customerId,
      paymentMethodId: paymentMethodId,
    };
  } catch (error: any) {
    throw new ApiError(httpStatus.CONFLICT, error.message);
  }
};

const getCustomerSavedCardsFromStripe = async (customerId: string) => {
  try {
    // List all payment methods for the customer
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: "card",
    });

    // Extract only the last4 digits from each payment method
    const cards = paymentMethods.data.map((card) => ({
      last4: card.card?.last4,
    }));

    return cards;
  } catch (error: any) {
    throw new ApiError(httpStatus.CONFLICT, error.message);
  }
};

// Delete a card from a customer in the stripe
const deleteCardFromCustomer = async (paymentMethodId: string) => {
  try {
    await stripe.paymentMethods.detach(paymentMethodId);
    return { message: "Card deleted successfully" };
  } catch (error: any) {
    throw new ApiError(httpStatus.CONFLICT, error.message);
  }
};

// Refund amount to customer in the stripe
const refundPaymentToCustomer = async (payload: {
  paymentIntentId: string;
}) => {
  try {
    // Refund the payment intent
    const refund = await stripe.refunds.create({
      payment_intent: payload?.paymentIntentId,
    });

    return refund;
  } catch (error: any) {
    throw new ApiError(httpStatus.CONFLICT, error.message);
  }
};

const getCustomerDetailsFromStripe = async (customerId: string) => {
  try {
    // Retrieve the customer details from Stripe
    const customer = await stripe.customers.retrieve(customerId);

    return customer;
  } catch (error: any) {
    throw new ApiError(httpStatus.NOT_FOUND, error.message);
  }
};

const getAllCustomersFromStripe = async () => {
  try {
    // Retrieve all customers from Stripe
    const customers = await stripe.customers.list({
      limit: 2,
    });

    return customers;
  } catch (error: any) {
    throw new ApiError(httpStatus.CONFLICT, error.message);
  }
};
// const updateAccount = async (payload: any) => {
//   const user = await prisma.user.findFirst({
//     where: {
//       accountId: payload.id,
//     },
//     select: {
//       id: true,
//     },
//   });
//   if (!user) {
//     throw new ApiError(httpStatus.NOT_FOUND, "user not found");
//   }
//   await prisma.user.update({
//     where: {
//       id: user.id,
//     },
//     data: {
//       onBoarding: true,
//       isVerified: true,
//     },
//   });
//   return;
// };

const generateNewAccountLink = async (user: User) => {
  const accountLink = await stripe.accountLinks.create({
    account: user.accountId as string,
    refresh_url: "https://success-page-xi.vercel.app/not-success",
    return_url: "https://success-page-xi.vercel.app/success",
    type: "account_onboarding",
  });
  // console.log(accountLink.url, 'check account link');
  const html = `
<div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; color: #333; border: 1px solid #ddd; border-radius: 10px;">
  <h2 style="color: #007bff; text-align: center;">Complete Your Onboarding</h2>

  <p>Dear <b>${user.name}</b>,</p>

  <p>We’re excited to have you onboard! To get started, please complete your onboarding process by clicking the link below:</p>

  <div style="text-align: center; margin: 20px 0;">
    <a href=${accountLink.url} style="background-color: #007bff; color: #fff; padding: 12px 20px; border-radius: 5px; text-decoration: none; font-weight: bold;">
      Complete Onboarding
    </a>
  </div>

  <p>If the button above doesn’t work, you can also copy and paste this link into your browser:</p>
  <p style="word-break: break-all; background-color: #f4f4f4; padding: 10px; border-radius: 5px;">
    ${accountLink.url}
  </p>

  <p><b>Note:</b> This link is valid for a limited time. Please complete your onboarding as soon as possible.</p>

  <p>Thank you,</p>
  <p><b>The Support Team</b></p>

  <hr style="border: 0; height: 1px; background: #ddd; margin: 20px 0;">
  <p style="font-size: 12px; color: #777; text-align: center;">
    If you didn’t request this, please ignore this email or contact support.
  </p>
</div>
`;
  await sendEmail(user?.email || "", "Your Onboarding Url", html);
};

export const StripeServices = {
  saveCardWithCustomerInfoIntoStripe,
  authorizedPaymentWithSaveCardFromStripe,
  capturePaymentRequestToStripe,
  saveNewCardWithExistingCustomerIntoStripe,
  getCustomerSavedCardsFromStripe,
  deleteCardFromCustomer,
  refundPaymentToCustomer,
  transferFundsWithStripe,
  getCustomerDetailsFromStripe,
  getAllCustomersFromStripe,
  // updateAccount,
  generateNewAccountLink,
};
