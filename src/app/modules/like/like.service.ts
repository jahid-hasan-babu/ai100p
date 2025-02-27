import prisma from "../../utils/prisma";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";
import { IPaginationOptions } from "../../interface/pagination.type";
import { paginationHelper } from "../../../helpers/paginationHelper";
import { notificationServices } from "../notifications/notification.service";

const createLike1 = async (userId: string, postId: string) => {
  const existingLike = await prisma.like.findFirst({
    where: {
      userId: userId,
      postId: postId,
    },
  });

  if (existingLike) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You have already liked this post"
    );
  }
  const like = await prisma.like.create({
    data: {
      userId: userId,
      postId: postId,
    },
  });
  return like;
};
const createLike = async (userId: string, postId: string) => {
  const existingLike = await prisma.like.findFirst({
    where: {
      userId: userId,
      postId: postId,
    },
  });

  if (existingLike) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You have already liked this post"
    );
  }

  const like = await prisma.like.create({
    data: {
      userId: userId,
      postId: postId,
    },
  });


  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { userId: true },
  });

  if (!post) {
    throw new ApiError(httpStatus.NOT_FOUND, "Post not found");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  const postOwner = await prisma.user.findUnique({
    where: { id: post.userId },
    select: { fcmToken: true },
  });

  if (postOwner?.fcmToken) {
    await notificationServices.sendSingleNotification({
      params: { userId: post.userId },
      user: { id: userId },
      body: {
        title: "New Like",
        body: user?.name
          ? `${user.name} liked your post`
          : "Someone liked your post",
      },
    });
  }

  return like;
};



const getAllLikeWithUser = async (
  postId: string,
  options: IPaginationOptions
) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const like = await prisma.like.findMany({
    where: { postId: postId },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip,
    select: {
      id: true,
      userId: true,
      postId: true,
      user: {
        select: {
          id: true,
          name: true,
          profileImage: true,
        },
      },
    },
  });
  return {
    meta: {
      total: await prisma.like.count({ where: { postId: postId } }),
      page,
      limit,
    },
    data: like,
  };
};

const removeLike = async (userId: string, postId: string) => {
  const existingLike = await prisma.like.findFirst({
    where: {
      userId: userId,
      postId: postId,
    },
  });

  if (!existingLike) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Like not found");
  }
  const like = await prisma.like.deleteMany({
    where: {
      AND: [{ userId: userId }, { postId: postId }],
    },
  });
  return like;
};

export const LikeServices = {
  createLike,
  getAllLikeWithUser,
  removeLike,
};
