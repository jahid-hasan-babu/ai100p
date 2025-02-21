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

export const CommentServices = {
  createComment,
};
