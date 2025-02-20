import { ProfileStatus, User } from "@prisma/client";
import * as bcrypt from "bcrypt";
import prisma from "../../utils/prisma";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";
import { stripe } from "../../utils/stripe";
import { generateToken } from "../../utils/generateToken";
import { Secret } from "jsonwebtoken";
import config from "../../../config";
import { fileUploader } from "../../helpers/fileUploader";
import { paginationHelper } from "../../../helpars/paginationHelper";
import { IPaginationOptions } from "../../interface/pagination.type";
import { searchFilter } from "../../utils/searchFilter";

interface UserWithOptionalPassword extends Omit<User, "password"> {
  password?: string;
}

const registerUserIntoDB = async (payload: any, files: any) => {
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

  let profileImage = null;
  if (files?.profileImage?.length > 0) {
    const uploadResult = await fileUploader.uploadToDigitalOcean(
      files.profileImage[0]
    );
    profileImage = uploadResult.Location;
  }

  const result = await prisma.$transaction(async (transactionClient) => {
    let profileStatus = "NEW";
    let certificate = null;

    if (payload.role === "SELLER") {
      if (files?.certificate?.length > 0) {
        const uploadResult = await fileUploader.uploadToDigitalOcean(
          files.certificate[0]
        );
        certificate = uploadResult.Location;
      }

      if (certificate) {
        profileStatus = ProfileStatus.CERTIFITE;
      }
    }

    // Creating the user in the database
    const user = await transactionClient.user.create({
      data: {
        ...payload,
        email: payload.email.trim(),
        password: hashedPassword,
        profileImage,
        profileStatus,
        certificate,
      },
    });

    if (payload.isShared) {
      await transactionClient.post.create({
        data: {
          image: profileImage,
          userId: user.id,
        },
      });
    }

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
      userName: user.userName,
      profileImage: user.profileImage,
      email: user.email,
      role: user.role,
      customerId: stripeCustomer.id,
      accessToken,
      certificate,
      profileStatus,
      locationLat: user.locationLat,
      locationLong: user.locationLong,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  });

  return result;
};

const getAllUsersFromDB = async (
  options: IPaginationOptions & { search?: string }
) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { search } = options;

  const searchFilters = searchFilter(search as string);

  // Fetch paginated users
  const result = await prisma.user.findMany({
    where: {
      ...searchFilters, // Ensuring search filters apply correctly
      AND: [
        {
          NOT: {
            role: {
              in: ["SUPERADMIN", "ADMIN"],
            },
          },
        },
        {
          NOT: {
            status: {
              in: ["BLOCKED", "INACTIVATE"],
            },
          },
        },
      ],
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
    skip,
    select: {
      id: true,
      name: true,
      userName: true,
      address: true,
      email: true,
      role: true,
      status: true,
      profileImage: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const total = await prisma.user.count({
    where: {
      ...searchFilters,
      AND: [
        {
          NOT: {
            role: {
              in: ["SUPERADMIN", "ADMIN"],
            },
          },
        },
        {
          NOT: {
            status: {
              in: ["BLOCKED", "INACTIVATE"],
            },
          },
        },
      ],
    },
  });

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data: result,
  };
};

const getAllSellerUsersFromDB = async (
  options: IPaginationOptions & { search?: string }
) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { search } = options;

  const searchFilters = searchFilter(search as string);

  const result = await prisma.user.findMany({
    where: {
      role: "SELLER",
      ...searchFilters,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
    skip,
    select: {
      id: true,
      email: true,
      name: true,
      userName: true,
      role: true,
      status: true,
      profileImage: true,
      profileStatus: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const total = await prisma.user.count({
    where: {
      ...searchFilters,
      role: "SELLER",
    },
  });

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data: result,
  };
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
      bio: true,
      dateOfBirth: true,
      gender: true,
      phone: true,
      website: true,
      facebook: true,
      twitter: true,
      instagram: true,
      tikTok: true,
      youtube: true,
      locationLat: true,
      locationLong: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return Profile;
};

const getUserDetailsFromDB = async (id: string) => {
  const existingUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!existingUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  const user = await prisma.user.findUniqueOrThrow({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      profileImage: true,
      profileStatus: true,
      bio: true,
      dateOfBirth: true,
      gender: true,
      phone: true,
      website: true,
      facebook: true,
      twitter: true,
      instagram: true,
      tikTok: true,
      youtube: true,
      locationLat: true,
      locationLong: true,
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
      role: true,
      status: true,
      profileImage: true,
      profileStatus: true,
      bio: true,
      dateOfBirth: true,
      gender: true,
      phone: true,
      website: true,
      facebook: true,
      twitter: true,
      instagram: true,
      tikTok: true,
      youtube: true,
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
  if (existingUser.status === "INACTIVATE")
    throw new ApiError(httpStatus.BAD_REQUEST, "User already deleted");
  const result = await prisma.user.update({
    where: {
      id: id,
    },
    data: {
      status: "INACTIVATE",
    },
  });
  return;
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
