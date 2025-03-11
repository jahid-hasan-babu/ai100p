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
import { paginationHelper } from "../../../helpers/paginationHelper";
import { IPaginationOptions } from "../../interface/pagination.type";
import { searchFilter } from "../../utils/searchFilter";
import { getDistance } from "geolib";
import cron from "node-cron";

interface UserWithOptionalPassword extends Omit<User, "password"> {
  password?: string;
}

cron.schedule("0 12 * * *", async () => {
  const newUsersToUpdate = await prisma.user.findMany({
    where: {
      profileStatus: "NEW",
    },
    select: {
      id: true,
      _count: {
        select: { followers: true },
      },
    },
  });

  const usersToUpdate = newUsersToUpdate.filter(
    (user) => user._count.followers > 10000
  );

  if (usersToUpdate.length > 0) {
    await prisma.user.updateMany({
      where: {
        id: { in: usersToUpdate.map((user) => user.id) },
      },
      data: { profileStatus: "POPULAR" },
    });
  }
});




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

const getAllAdmin = async () => {
  // Fetch paginated users
  const result = await prisma.user.findMany({
    where: {
      AND: [
        {
          role: {
            in: ["ADMIN"],
          },
        },
      ],
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      userName: true,
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

const getAllCustomerUsersFromDB = async (
  options: IPaginationOptions & { search?: string }
) => {

  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { search } = options;

  const searchFilters = searchFilter(search as string);

  const result = await prisma.user.findMany({
    where: {
      role: "USER",
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
      role: "USER",
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
      userName: true,
      email: true,
      role: true,
      status: true,
      profileImage: true,
      profileStatus: true,
      bio: true,
      dateOfBirth: true,
      gender: true,
      phone: true,
      isNotification: true,
      website: true,
      facebook: true,
      twitter: true,
      instagram: true,
      tikTok: true,
      youtube: true,
      address: true,
      locationLat: true,
      locationLong: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          followers: true,
          following: true,
          Post: true,
        },
      },
    },
  });

  return Profile;
};

const getUserDetailsFromDB = async (id: string, currentUserId: string) => {
  const existingUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!existingUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  // Check if the current user follows the target user
  const isFollow = await prisma.follower.findFirst({
    where: {
      followerId: currentUserId,
      followingId: id,
    },
  });

  // Get current user's location
  const user1 = await prisma.user.findUnique({
    where: { id: currentUserId },
    select: {
      locationLat: true,
      locationLong: true,
    },
  });

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: currentUserId },
    select: {
      id: true,
      name: true,
      userName: true,
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
      Service: {
        orderBy: {
          createdAt: "desc",
        },
        take: 8, // Limit services to 8
        select: {
          id: true,
          serviceImage: true,
          title: true,
          price: true,
          locationLat: true,
          locationLong: true,
        },
      },
      _count: {
        select: {
          followers: true,
          following: true,
          Post: true,
        },
      },
    },
  });

  // Compute review statistics and distance for each service
  const servicesWithRatings = await Promise.all(
    user.Service.map(async (service) => {
      const ratingStats = await prisma.review.aggregate({
        where: { serviceId: service.id },
        _avg: { rating: true },
        _count: { rating: true },
      });

      const distance =
        getDistance(
          {
            latitude: user1?.locationLat ?? 0,
            longitude: user1?.locationLong ?? 0,
          },
          {
            latitude: service?.locationLat ?? 0,
            longitude: service?.locationLong ?? 0,
          }
        ) / 1000; // Convert meters to km

      return {
        ...service,
        distance,
        reviewStats: {
          averageRating: ratingStats._avg.rating || 0,
          totalReviews: ratingStats._count.rating || 0,
        },
      };
    })
  );

  return { ...user, Service: servicesWithRatings, isFollow: !!isFollow };
};

const getSingleSellerFromDB = async (id: string) => {
  const seller = await prisma.user.findUniqueOrThrow({
    where: { id: id },
    select: {
      id: true,
      name: true,
      userName: true,
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
      address: true,
      locationLat: true,
      locationLong: true,
      createdAt: true,
      updatedAt: true,
      Service: {
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          serviceImage: true,
          title: true,
          price: true,
          locationLat: true,
          locationLong: true,
        },
      },
      _count: {
        select: {
          followers: true,
          following: true,
        },
      },
    },
  });

  return seller;
};

const updateMyProfileIntoDB = async (id: string, payload: any, files: any) => {
  const existingUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!existingUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User not found");
  }

  let profileImage = null;
  if (files?.profileImage?.length > 0) {
    const uploadResult = await fileUploader.uploadToDigitalOcean(
      files.profileImage[0]
    );
    profileImage = uploadResult.Location;
  }

  const updatedData = {
    ...payload,
    profileImage: profileImage,
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
      address: true,
      locationLat: true,
      locationLong: true,
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

const changePassword = async (
  id: string,
  payload: { currentPass: string; newPass: string }
) => {
  const existingUser = await prisma.user.findUnique({
    where: { id },
    select: { password: true },
  });

  if (!existingUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const bcryptPassword = existingUser.password;
  const isMatch = await bcrypt.compare(
    payload.currentPass,
    bcryptPassword as string
  );

  if (!isMatch) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "Current password is incorrect"
    );
  }

  const hashedPassword = await bcrypt.hash(
    payload.newPass,
    parseInt(process.env.BCRYPT_SALT_ROUNDS || "12")
  );

  await prisma.user.update({
    where: { id },
    data: { password: hashedPassword },
  });

  return;
};

const notificationPermission = async (id: string, payload: any) => {
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
      isNotification: payload.isNotification,
    },
  });

  return;
};

const socialLogin = async (payload: any) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        email: payload.email,
      },
    });

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { fcmToken: payload.fcmToken || null },
      });
      const accessToken = generateToken(
        {
          id: user.id,
          email: user.email || "",
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
        profileStatus: user.profileStatus,
        email: user.email,
        customerId: user.customerId,
        locationLat: user.locationLat,
        locationLong: user.locationLong,
        role: user.role,
        accessToken: accessToken,
      };
    } else {
      const result = await prisma.$transaction(async (transactionClient) => {
        const stripeCustomer = await stripe.customers.create({
          email: payload.email,
          name: payload.fullName || undefined,
          phone: payload.phone || undefined,
        });

        if (!stripeCustomer || !stripeCustomer.id) {
          throw new ApiError(
            httpStatus.INTERNAL_SERVER_ERROR,
            "Failed to create a Stripe customer"
          );
        }

        const newUser = await transactionClient.user.create({
          data: {
            email: payload.email || "",
            role: payload.role || "USER",
            customerId: stripeCustomer.id,
            fcmToken: payload.fcmToken || "",
          },
        });

        return newUser;
      });

      const accessToken = generateToken(
        {
          id: result.id,
          email: result.email || "",
          role: result.role,
        },
        config.jwt.access_secret as Secret,
        config.jwt.access_expires_in as string
      );

      return {
        id: result.id,
        name: result.name,
        userName: result.userName,
        profileImage: result.profileImage,
        profileStatus: result.profileStatus,
        email: result.email,
        customerId: result.customerId,
        locationLat: result.locationLat,
        locationLong: result.locationLong,
        role: result.role,
        accessToken: accessToken,
      };
    }
  } catch (error: any) {
    console.error("Error during social login:", error.message || error);
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Error during social login",
      error.message || "An unexpected error occurred"
    );
  }
};

export const UserServices = {
  registerUserIntoDB,
  getAllUsersFromDB,
  getAllAdmin,
  getAllSellerUsersFromDB,
  getAllCustomerUsersFromDB,
  getMyProfileFromDB,
  getUserDetailsFromDB,
  getSingleSellerFromDB,
  updateUserStatus,
  updateMyProfileIntoDB,
  deleteUser,
  notificationPermission,
  changePassword,
  socialLogin,
};
