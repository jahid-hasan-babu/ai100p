import httpStatus from "http-status";
import ApiError from "../../errors/ApiError";
import prisma from "../../utils/prisma";
import { fileUploader } from "../../helpers/fileUploader";

const createReview = async (userId: string,serviceId:string, payload: any, files: any) => {
  const existingUser = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!existingUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  let reviewFile = null;


  if (files) {
    const uploadResult = await fileUploader.uploadToDigitalOcean(files);
    reviewFile = uploadResult.Location;
  }



  const result = await prisma.review.create({
    data: {
      userId: userId,
      serviceId:serviceId,
      ...payload,
      reviewFile: reviewFile,
    },
  });
  return result;
};

const deleteReview = async (userId: string, id: string) => {
  const existingReview = await prisma.review.findUnique({
    where: {
      id,
    },
  });

  if (!existingReview) {
    throw new ApiError(httpStatus.NOT_FOUND, "Review not found");
  }

  const result = await prisma.review.delete({
    where: {
      id,
      userId,
    },
  });
  return;
};

const getMyReviews = async (userId: string) => {
  const result = await prisma.review.findMany({
    where: {
      userId,
    },
    select: {
      id: true,
      rating: true,
      
      service: {
        select: {
          id: true,
          title: true,
          price: true,
          serviceImage: true,
          date: true,
        },
      }
    }
  });
  return result;
};

export const ReviewServices = {
  createReview,
  deleteReview,
  getMyReviews,
};
