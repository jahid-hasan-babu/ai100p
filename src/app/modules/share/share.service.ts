import prisma from "../../utils/prisma";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";
import { IPaginationOptions } from "../../interface/pagination.type";
import { paginationHelper } from "../../../helpers/paginationHelper";

const createShare = async (userId: string, postId: string) => {
  const existingPost = await prisma.post.findUnique({
    where: {
      id: postId,
      isDeleted: false,
    },
  });

  if (!existingPost) {
    throw new ApiError(httpStatus.NOT_FOUND, "Post not found");
  }

  const result = await prisma.share.create({
    data: {
      userId: userId,
      postId: postId,
    },
  });

  return result;
};

const getMyPostShareList = async (
  userId: string,
  postId: string,
  options: IPaginationOptions
) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const result = await prisma.share.findMany({
    where: {
      postId: postId,
    },
    select: {
      post: {
        select: {
          id: true,
          user: {
            select: {
              id: true,
            },
          },
        },
      },
    },
  });

  const matchedUser = result.find((item) => item.post.user.id == userId);
  if (!matchedUser) {
    throw new ApiError(httpStatus.FORBIDDEN, "You don't have permission");
  }

  const share = await prisma.share.findMany({
    where: {
      postId: postId,
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
      total: await prisma.share.count({
        where: {
          userId: userId,
        },
      }),
      page,
      limit,
    },
    share,
  };
};

export const ShareServices = {
  createShare,
  getMyPostShareList,
};
