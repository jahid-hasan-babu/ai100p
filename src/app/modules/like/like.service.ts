import prisma from "../../utils/prisma";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";




const createLike = async (userId: string, postId: string) => {
  const existingLike = await prisma.like.findFirst({
    where: {
      userId: userId,
      postId: postId
    },
  })

  if (existingLike) { 
    throw new ApiError(httpStatus.BAD_REQUEST, "You have already liked this post");
  }
  const like = await prisma.like.create({
    data: {
      userId: userId,
      postId: postId,
    },
  });
  return like;
};

const removeLike = async (userId: string, postId: string) => {

  const existingLike = await prisma.like.findFirst({
    where: {
      userId: userId,
      postId: postId
    },
  })

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
  removeLike,
};
