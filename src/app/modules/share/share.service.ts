import prisma from "../../utils/prisma";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";


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
  })

  return result
}

export const ShareServices = {
  createShare
};
