import prisma from "../../utils/prisma";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";
import { IPaginationOptions } from "../../interface/pagination.type";
import { paginationHelper } from "../../../helpers/paginationHelper";

const createComment = async (
  payload: { comment: string },
  userId: string,
  postId: string
) => {
  const existingPost = await prisma.post.findUnique({
    where: {
      id: postId,
      isDeleted: false,
    },
  });

  if (!existingPost) {
    throw new ApiError(httpStatus.NOT_FOUND, "Post not found");
  }

  const comment = await prisma.comment.create({
    data: {
      comment: payload.comment,
      userId: userId,
      postId: postId,
    },
  });
  return comment;
};

const getAllComments = async (postId: string, options: IPaginationOptions) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);

  const comments = await prisma.comment.findMany({
    where: {
      postId: postId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
    skip,
    include: {
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
      total: await prisma.comment.count({
        where: {
          postId: postId,
        },
      }),
      page,
      limit,
    },
    data: comments,
  };
};

const updateComment = async (
  commentId: string,
  payload: { comment: string }
) => {
  const existingComment = await prisma.comment.findUnique({
    where: {
      id: commentId,
    },
  });

  if (!existingComment) {
    throw new ApiError(httpStatus.NOT_FOUND, "Comment not found");
  }
  const comment = await prisma.comment.update({
    where: {
      id: commentId,
    },
    data: {
      comment: payload.comment,
    },
  });
  return comment;
};

const deleteComment = async (commentId: string) => {
  const existingComment = await prisma.comment.findUnique({
    where: {
      id: commentId,
    },
  });

  if (!existingComment) {
    throw new ApiError(httpStatus.NOT_FOUND, "Comment not found");
  }

  const result = await prisma.comment.delete({
    where: {
      id: commentId,
    },
  });
  return;
};
export const CommentServices = {
  createComment,
  getAllComments,
  updateComment,
  deleteComment,
};
