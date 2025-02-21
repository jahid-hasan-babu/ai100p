import prisma from "../../utils/prisma";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";

const createComment = async (payload: { comment: string }, userId: string, postId: string) => {
  
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
}

const getAllComments = async (postId: string) => {
  const comments = await prisma.comment.findMany({
    where: {
      postId: postId,
    },
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
  return comments;
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
