import { ProfileStatus, User } from "@prisma/client";
import * as bcrypt from "bcrypt";
import prisma from "../../utils/prisma";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";
import { stripe } from "../../utils/stripe";
import { generateToken } from "../../utils/generateToken";
import { Secret } from "jsonwebtoken";
import config from "../../../config";

interface UserWithOptionalPassword extends Omit<User, "password"> {
  password?: string;
}

const registerUserIntoDB = async (payload: any, file: any) => {
  const hashedPassword: string = await bcrypt.hash(
    payload.password,
    parseInt(config.bcrypt_salt_rounds as any)
  );

  const existingUser = await prisma.user.findUnique({
    where: { email: payload.email.trim() },
  });
  if (existingUser) {
    throw new Error("User already exists with this email");
  }

  const stripeCustomer = await stripe.customers.create({
    email: payload.email.trim(),
    name: payload.name || undefined,
  });

  if (!stripeCustomer.id) {
    throw new Error("Failed to create a Stripe customer");
  }

  const result = await prisma.$transaction(async (transactionClient) => {
    let stripeAccountId = null;
    let stripeOnboardingLink = null;
    let profileStatus = "NEW";
    let certificate = null;

    if (payload.role === "SELLER") {
      certificate = file
        ? `${process.env.BACKEND_BASE_URL}/uploads/${file.filename}`
        : null;

      if (certificate) {
        profileStatus = ProfileStatus.CERTIFITE;
      }

      const stripeAccount = await stripe.accounts.create({
        type: "express",
        country: "US",
        email: payload.email.trim(),
        metadata: {
          userId: payload.email.trim(),
        },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      if (!stripeAccount || !stripeAccount.id) {
        throw new Error("Failed to create a Stripe account");
      }

      stripeAccountId = stripeAccount.id;

      const accountLink = await stripe.accountLinks.create({
        account: stripeAccount.id,
        refresh_url: `http://10.0.20.36:3000/reauthenticate`,
        return_url: `http://10.0.20.36:3000/onboarding-success`,
        type: "account_onboarding",
      });

      stripeOnboardingLink = accountLink.url;
    }

    // Creating the user in the database
    const user = await transactionClient.user.create({
      data: {
        ...payload,
        email: payload.email.trim(),
        password: hashedPassword,
        customerId: stripeCustomer.id,
        profileStatus, // Assign the profileStatus dynamically
        certificate, // Save certificate if provided
      },
    });

    const accessToken = generateToken(
      {
        id: user.id,
        email: user.email?.trim() as string,
        role: user.role,
      },
      config.jwt.access_secret as Secret,
      config.jwt.access_expires_in as string
    );

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      customerId: stripeCustomer.id,
      stripeAccountId,
      stripeOnboardingLink,
      accessToken,
      certificate: certificate,
      profileStatus, // Return profileStatus in response
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  });

  return result;
};

const getAllUsersFromDB = async () => {
  const result = await prisma.user.findMany({
    where: {
      NOT: {
        role: {
          in: ["SUPERADMIN", "ADMIN"],
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      profileImage: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return result;
};

const getAllSellerUsersFromDB = async () => {
  const result = await prisma.user.findMany({
    where: {
      role: "SELLER",
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      profileImage: true,
      profileStatus: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return result;
};

const getMyProfileFromDB = async (id: string) => {
  const Profile = await prisma.user.findUniqueOrThrow({
    where: {
      id: id,
    },

    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      profileImage: true,
      profileStatus: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return Profile;
};

const getUserDetailsFromDB = async (id: string) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      profileImage: true,
      profileStatus: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return user;
};

const updateMyProfileIntoDB = async (id: string, payload: any) => {
  const existingUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!existingUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User not found");
  }

  const updatedData = {
    ...payload,
  };

  const result = await prisma.user.update({
    where: {
      id: id,
    },
    data: updatedData,
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return result;
};

const updateUserStatus = async (id: string, status: any) => {
  const existingUser = await prisma.user.findUnique({
    where: {
      id: id,
    },
  });

  if (!existingUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const result = await prisma.user.update({
    where: {
      id: id,
    },
    data: {
      status: status,
    },
  });

  return result;
};
const deleteUser = async (id: string) => {
  const existingUser = await prisma.user.findUnique({
    where: {
      id: id,
    },
  });

  if (!existingUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  const result = await prisma.user.delete({
    where: {
      id: id,
    },
  });
  return result;
};

export const UserServices = {
  registerUserIntoDB,
  getAllUsersFromDB,
  getAllSellerUsersFromDB,
  getMyProfileFromDB,
  getUserDetailsFromDB,
  updateUserStatus,
  updateMyProfileIntoDB,
  deleteUser,
};
