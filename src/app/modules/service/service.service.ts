import prisma from "../../utils/prisma";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";
import { IPaginationOptions } from "../../interface/pagination.type";
import { paginationHelper } from "../../../helpers/paginationHelper";
import { fileUploader } from "../../helpers/fileUploader";
import {  searchFilter3 } from "../../utils/searchFilter";
import { deleteFromS3ByUrl } from "../../../helpers/fileDeletedFromS3";
import { StripeServices } from "../payment/payment.service";
import { stripe } from "../../utils/stripe";
import { getDistance } from "geolib";

const createService = async (payload: any, userId: string, files: any) => {
  const existingUser = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (existingUser?.accountId === null) {
    const stripeAccount = await stripe.accounts.create({
      type: "express",
      country: "US",
      email: payload.email,
      metadata: {
        userId: existingUser.id,
      },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    if (!stripeAccount || !stripeAccount.id) {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to create a Stripe account"
      );
    }
    let updateUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        accountId: stripeAccount.id,
      },
    });

    StripeServices.generateNewAccountLink(updateUser);

    throw new ApiError(
      httpStatus.TEMPORARY_REDIRECT,
      "We sent you an onboarding URL. Please check your email."
    );
  } else if (existingUser?.accountId) {
    const isaccount = await stripe.accounts.retrieve(
      existingUser?.accountId as string
    );
    if (!isaccount.details_submitted || !isaccount.charges_enabled) {
      await StripeServices.generateNewAccountLink(existingUser);
      throw new ApiError(
        httpStatus.TEMPORARY_REDIRECT,
        "We sent you an onboarding URL. Please check your email."
      );
    }
  }

  let serviceImage = [];

  if (files && files.length > 0) {
    const uploadResults = await Promise.all(
      files.map(async (file: any) => {
        const uploadResult = await fileUploader.uploadToDigitalOcean(file);
        return uploadResult.Location;
      })
    );
    serviceImage = uploadResults;
  }

  const result = await prisma.service.create({
    data: {
      ...payload,
      userId: userId,
      serviceImage: serviceImage,
    },
  });
  return result;
};

const getMyServices = async (
  userId: string,
  options: IPaginationOptions & { search?: string }
) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { search } = options;
  const searchFilters = search ? searchFilter3(search) : {};

  const services = await prisma.service.findMany({
    where: {
      userId: userId,
      isDeleted: false,
      ...searchFilters,
    },
    skip: skip,
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
  });

   const user = await prisma.user.findUnique({
     where: { id: userId },
     select: {
       locationLat: true,
       locationLong: true,
     },
   });

   const servicesWithDistance = await Promise.all(
     services.map(async (service) => {
       const ratingStats = await prisma.review.aggregate({
         where: { serviceId: service.id },
         _avg: { rating: true },
         _count: { rating: true },
       });

       const distance =
         getDistance(
           {
             latitude: user?.locationLat ?? 0,
             longitude: user?.locationLong ?? 0,
           },
           {
             latitude: service.locationLat ?? 0,
             longitude: service.locationLong ?? 0,
           }
         ) / 1000; // Convert meters to km

       return {
         ...service,
         distance, // Add distance in km
         reviewStats: {
           averageRating: ratingStats._avg.rating || 0,
           totalReviews: ratingStats._count.rating || 0,
         },
       };
     })
   );

   return {
     meta: {
       total: await prisma.service.count({
         where: { userId: userId, ...searchFilters, isDeleted: false },
       }),
       page,
       limit,
     },
     data: servicesWithDistance,
   };
};

const getAllServices1 = async (
  options: IPaginationOptions & { search?: string }
) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { search } = options;
  const searchFilters = search ? searchFilter3(search) : {};

  const todayDate = new Date().toISOString().split("T")[0];

  const services = await prisma.service.findMany({
    where: {
      isDeleted: false,
      ...searchFilters,
      date: {
        gte: todayDate,
      },
    },
    skip: skip,
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
  });

  const servicesWithRatings = await Promise.all(
    services.map(async (service) => {
      const ratingStats = await prisma.review.aggregate({
        where: { serviceId: service.id },
        _avg: { rating: true },
        _count: { rating: true },
      });

      return {
        ...service,
        reviewStats: {
          averageRating: ratingStats._avg.rating || 0,
          totalReviews: ratingStats._count.rating || 0,
        },
      };
    })
  );

  return {
    meta: {
      total: await prisma.service.count({
        where: { ...searchFilters, isDeleted: false },
      }),
      page,
      limit,
    },
    data: servicesWithRatings,
  };
};

const getAllServices = async (
  options: IPaginationOptions & { search?: string },
  userId: string
) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { search } = options;
  const searchFilters = search ? searchFilter3(search) : {};

  const todayDate = new Date().toISOString().split("T")[0];

  // Fetch user location
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      locationLat: true,
      locationLong: true,
    },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  const services = await prisma.service.findMany({
    where: {
      isDeleted: false,
      ...searchFilters,
      date: { gte: todayDate },
    },
    skip: skip,
    take: limit,
    orderBy: { createdAt: "desc" },
  });

  // Calculate distance and attach it to each service
  const servicesWithDistance = await Promise.all(
    services.map(async (service) => {
      const ratingStats = await prisma.review.aggregate({
        where: { serviceId: service.id },
        _avg: { rating: true },
        _count: { rating: true },
      });

      const distance =
        getDistance(
          {
            latitude: user?.locationLat ?? 0,
            longitude: user?.locationLong ?? 0,
          },
          {
            latitude: service.locationLat ?? 0,
            longitude: service.locationLong ?? 0,
          }
        ) / 1000; // Convert meters to km

      return {
        ...service,
        distance, // Add distance in km
        reviewStats: {
          averageRating: ratingStats._avg.rating || 0,
          totalReviews: ratingStats._count.rating || 0,
        },
      };
    })
  );

  return {
    meta: {
      total: await prisma.service.count({
        where: { ...searchFilters, isDeleted: false },
      }),
      page,
      limit,
    },
    data: servicesWithDistance,
  };
};

const getPopularArtist = async (
  options: IPaginationOptions & { search?: string }
) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const services = await prisma.user.findMany({
    where: {
      role: "SELLER",
      status: "ACTIVATE",
      profileStatus: "POPULAR",
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
      profileImage: true,
    },
  });
  return {
    meta: {
      total: await prisma.user.count({
        where: {
          role: "SELLER",
          status: "ACTIVATE",
          profileStatus: "POPULAR",
        },
      }),
      page,
      limit,
    },
    data: services,
  };
};

const updateService = async (
  serviceId: string,
  payload: any,
  userId: string,
  files: any
) => {
  const existingService = await prisma.service.findUnique({
    where: { id: serviceId, userId: userId },
    select: { serviceImage: true },
  });

  if (!existingService) {
    throw new Error("Service not found or unauthorized access");
  }

  let serviceImage = existingService.serviceImage;

  if (files && files.length > 0) {
    for (const imageUrl of existingService.serviceImage) {
      try {
        await deleteFromS3ByUrl(imageUrl as string);
      } catch (error) {
        console.error("Failed to delete old image:", error);
        throw new ApiError(
          httpStatus.INTERNAL_SERVER_ERROR,
          "Failed to delete previous images"
        );
      }
    }

    const uploadResults = await Promise.all(
      files.map(async (file: any) => {
        const uploadResult = await fileUploader.uploadToDigitalOcean(file);
        return uploadResult.Location;
      })
    );
    serviceImage = uploadResults.slice(0, 5);
  }

  const updatedService = await prisma.service.update({
    where: { id: serviceId, userId: userId },
    data: {
      ...payload,
      serviceImage: serviceImage,
      updatedAt: new Date(),
    },
  });

  return updatedService;
};

const deleteService = async (serviceId: string, userId: string) => {
  const service = await prisma.service.findUnique({
    where: { id: serviceId, userId: userId },
  });

  if (!service) {
    throw new Error("Service not found or unauthorized access");
  }

  const result = await prisma.service.update({
    where: { id: serviceId, userId: userId },
    data: {
      isDeleted: true,
    },
  });
  return;
};

export const serviceServices = {
  createService,
  getMyServices,
  getAllServices,
  getPopularArtist,
  updateService,
  deleteService,
};
