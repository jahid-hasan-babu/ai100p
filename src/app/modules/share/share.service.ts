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

const getMyPostShareList = async (userId: string, postId: string) => {
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

  const sahre = await prisma.share.findMany({
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
              name: true,
              profileImage: true,
            },
          },
        },
      },
    },
  });

  return sahre;
};

export const ShareServices = {
  createShare,
  getMyPostShareList,
};
