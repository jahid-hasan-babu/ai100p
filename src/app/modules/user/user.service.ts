import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import prisma from '../../utils/prisma';
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";
import { stripe } from "../../utils/stripe";
import { generateToken } from "../../utils/generateToken";
import { Secret } from "jsonwebtoken";
import config from "../../../config";

interface UserWithOptionalPassword extends Omit<User, "password"> {
  password?: string;
}

const registerUserIntoDB = async (payload: any) => {
  const hashedPassword: string = await bcrypt.hash(payload.password, 12);


  const userData = {
    ...payload,
    password: hashedPassword,

  };

  const existingUser = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (existingUser) {
    throw new Error("User already exists with this email");
  }

  const result = await prisma.$transaction(async (transactionClient: any) => {
    // Create a Stripe customer
    const stripeCustomer = await stripe.customers.create({
      email: payload.email,
      name: payload.fullName || undefined,
      phone: payload.phone || undefined,
    });

    if (!stripeCustomer.id) {
      throw new Error("Failed to create a Stripe customer");
    }

    const user = await transactionClient.user.create({
      data: {
        ...userData,
        customerId: stripeCustomer.id,
      },
    });
    const accessToken = generateToken(
      {
        id: user.id,
        email: user.email as string,
        role: user.role,
      },
      config.jwt.access_secret as Secret,
      config.jwt.access_expires_in as string
    );

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      customerId: stripeCustomer.id,
      accessToken: accessToken,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  });

  return result;
};

const getAllUsersFromDB = async () => {
  const result = await prisma.user.findMany({
    select: {
      id: true,
      phone: true,
      email: true,
      role: true,
      status: true,
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
      phone: true,
      email: true,
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
      phone: true,
      email: true,
      role: true,
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
      phone: true,
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
  getMyProfileFromDB,
  getUserDetailsFromDB,
  updateUserStatus,
  updateMyProfileIntoDB,
  deleteUser,
};
