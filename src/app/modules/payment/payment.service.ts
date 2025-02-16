import prisma from "../../utils/prisma";
import httpStatus from "http-status";
import Stripe from "stripe";
import ApiError from "../../errors/ApiError";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-12-18.acacia",
});

const createPaymentWithSavedCard = async (
  userId: string,
  payload: {
    products: { productId: string; quantity: number; size?: string }[];
    paymentMethodId: string;
  }
) => {
  const { products, paymentMethodId } = payload;

  if (!products || !Array.isArray(products) || products.length === 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Products are required and must be a non-empty array"
    );
  }

  await prisma.addToCart.deleteMany({
    where: {
      userId,
      productId: { in: products.map((p) => p.productId) },
    },
  });

  if (!paymentMethodId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Payment method ID is required");
  }

  // Fetch user details
  const user: any = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      customerId: true,
      email: true,
      name: true,
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  // Fetch product details and calculate total amount
  const productDetails = await Promise.all(
    products.map(async ({ productId, quantity, size }) => {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: {
          id: true,
          name: true,
          price: true,
          description: true,
          productImage: true,
        },
      });

      if (!product) {
        throw new ApiError(
          httpStatus.NOT_FOUND,
          `Product with ID ${productId} not found`
        );
      }

      return {
        ...product,
        quantity,
        size: size || null, // Ensure `size` is optional
        totalPrice: product.price * quantity,
      };
    })
  );

  // Calculate total amount
  const totalAmount = productDetails.reduce(
    (acc, product) => acc + product.totalPrice,
    0
  );

  if (totalAmount <= 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid total amount");
  }

  // Attach PaymentMethod to the Customer
  await stripe.paymentMethods.attach(paymentMethodId, {
    customer: user.customerId,
  });

  // Create a PaymentIntent with the total amount
  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalAmount * 100, // Convert to cents
    currency: "usd",
    customer: user.customerId || "",
    payment_method: paymentMethodId,
    off_session: true,
    confirm: true,
    capture_method: "manual",
  });

  // Create the order record in the database
  const order = await prisma.order.create({
    data: {
      userId: user.id,
      totalAmount: totalAmount,
      paymentIntentId: paymentIntent.id,
      products: productDetails.map((product) => ({
        productId: product.id,
        name: product.name,
        quantity: product.quantity,
        productImage: product.productImage,
        size: product.size,
        price: product.price,
        totalPrice: product.totalPrice,
      })),
    },
  });

  // Prepare the response
  return {
    paymentIntentId: paymentIntent.id,
    amount: totalAmount,
    email: user.email,
    object: paymentIntent.object,
    payment_method: paymentIntent.payment_method,
    orderId: order.id,
    products: productDetails.map((product) => ({
      id: product.id,
      size: product.size,
      name: product.name,
      price: product.price,
      quantity: product.quantity,
      productImage: product.productImage,
      totalPrice: product.totalPrice,
    })),
  };
};

const capturePayment = async (
  userId: string,
  payload: {
    address: string;
    phone: string;
    paymentIntentId: string;
  }
) => {
  const { address, phone, paymentIntentId } = payload;

  // Fetch the user details
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      customerId: true,
      email: true,
      name: true,
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  if (!paymentIntentId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Payment Intent ID is required");
  }

  // Find the existing order using paymentIntentId
  const existingOrder = await prisma.order.findFirst({
    where: { paymentIntentId },
    select: {
      id: true,
      products: true, // Assuming `products` is stored as JSON (Array)
    },
  });

  if (!existingOrder) {
    throw new ApiError(httpStatus.NOT_FOUND, "Order not found");
  }

  // Capture the payment using Stripe
  const capturedPayment = await stripe.paymentIntents.capture(paymentIntentId);

  if (capturedPayment.status !== "succeeded") {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Payment capture failed"
    );
  }

  // Update the order with payment details
  const updatedOrder = await prisma.order.update({
    where: { id: existingOrder.id },
    data: {
      address: address,
      phone,
      paymentStatus: "PAID",
      totalAmount: capturedPayment.amount / 100,
    },
  });

  // Create the payment record
  await prisma.payment.create({
    data: {
      userId: user.id,
      orderId: existingOrder.id,
      amount: capturedPayment.amount / 100,
    },
  });

  // Ensure products exist and are an array before updating stock
  if (existingOrder.products && Array.isArray(existingOrder.products)) {
    await Promise.all(
      existingOrder.products.map(async (product: any) => {
        if (product.productId && product.quantity) {
          await prisma.product.update({
            where: { id: product.productId },
            data: {
              inStock: {
                decrement: product.quantity,
              },
            },
          });
        }
      })
    );
  }

  return { orderId: updatedOrder.id };
};

const refundPayment = async (orderId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
      paymentIntentId: true,
      paymentStatus: true,
      totalAmount: true,
      products: true,
    },
  });

  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, "Order not found");
  }

  if (order.paymentStatus !== "PAID") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Only paid orders can be refunded"
    );
  }

  const refundAmount = (order.totalAmount ?? 0) * 100;

  const refund = await stripe.refunds.create({
    payment_intent: order.paymentIntentId ?? "",
    amount: refundAmount,
  });

  if (refund.status === "succeeded") {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: "REFUNDED",
      },
    });

    let parsedProducts;
    try {
      parsedProducts =
        typeof order.products === "string"
          ? JSON.parse(order.products)
          : order.products;
    } catch (error) {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to parse products data"
      );
    }

    await Promise.all(
      parsedProducts.map(async (product: { id: string; quantity: number }) => {
        await prisma.product.update({
          where: { id: product.id },
          data: {
            inStock: {
              increment: product.quantity,
            },
          },
        });
      })
    );

    return {
      refundId: refund.id,
      message: "Refund successfully processed",
    };
  } else {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Refund process failed"
    );
  }
};

export const PaymentServices = {
  createPaymentWithSavedCard,
  capturePayment,
  refundPayment,
};
