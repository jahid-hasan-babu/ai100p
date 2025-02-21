import prisma from "../../utils/prisma";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";
import { IPaginationOptions } from "../../interface/pagination.type";
import { paginationHelper } from "../../../helpars/paginationHelper";


const savedPost = async (userId: string, postId: string) => {
  const existingPost = await prisma.savedPost.findFirst({
    where: {
      userId: userId,
      postId: postId
    },
  })

  if (existingPost) {
    throw new ApiError(httpStatus.BAD_REQUEST, "You have already saved this post");
  }

  const savedPost = await prisma.savedPost.create({
    data: {
      userId: userId,
      postId: postId,
    },
  });
  return savedPost;
};

const getMySavedPost = async (
  userId: string,
  options: IPaginationOptions
) => {

   const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const savedPost = await prisma.savedPost.findMany({
    where: {
      userId: userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
    skip,
    select: {
      post: {
        select: {
          id: true,
          title: true,
          address: true,
          image: true,
          user: {
            select: {
              id: true,
              name: true,
              profileImage: true,
            },
          },
        },
      },
    },
  });
  return {
    meta: {
      total: await prisma.savedPost.count({
        where: {
          userId: userId,
        },
      }),
      page,
      limit,
      skip,
    },
    data: savedPost,
  };
};

const removeSavedPost = async (userId: string, postId: string) => {
  const existingPost = await prisma.savedPost.findFirst({
    where: {
      userId: userId,
      id: postId
    },
  })

  if (!existingPost) {
    throw new ApiError(httpStatus.BAD_REQUEST, "You have not saved this post");
  }

  const savedPost = await prisma.savedPost.deleteMany({
    where: {
      userId: userId,
      id: postId
    },
  })

  return
}


export const SavedServices = {
  savedPost,
  getMySavedPost,
  removeSavedPost,
};
