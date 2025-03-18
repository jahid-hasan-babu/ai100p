import prisma from "../../utils/prisma";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";
import { fileUploader } from "../../helpers/fileUploader";
import { paginationHelper } from "../../../helpers/paginationHelper";
import { IPaginationOptions } from "../../interface/pagination.type";
import { searchFilter2 } from "../../utils/searchFilter";
import { deleteFromS3ByUrl } from "../../../helpers/fileDeletedFromS3";

const createPost = async (userId: string, payload: any, files: any) => {
  let image = null;
  if (files) {
    const uploadResult = await fileUploader.uploadToDigitalOcean(files);
    image = uploadResult.Location;
  }
  const post = await prisma.post.create({
    data: {
      ...payload,
      userId: userId,
      image: image,
    },
  });
  return post;
};



const getAllPosts = async (
  options: IPaginationOptions & { search?: string; currentUserId: number },
  userId: string
) => {
  const { search } = options;


  const searchFilters = searchFilter2(search as string);

  const { page, limit, skip } = paginationHelper.calculatePagination(options);

  const result = await prisma.post.findMany({
    orderBy: {
      createdAt: "desc",
    },
    where: {
      ...searchFilters,
      isDeleted: false,
    },
    take: limit,
    skip,
    select: {
      id: true,
      title: true,
      address: true,
      image: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          profileImage: true,
          profileStatus: true,
        },
      },
      Like: {
        take: 3,
        orderBy: {
          id: "desc",
        },
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
      _count: {
        select: {
          Like: true,
          Comment: true,
          Share: true,
        },
      },
    },
  });

  const postsWithLikeStatus = await Promise.all(
    result.map(async (post) => {
      const like = await prisma.like.findFirst({
        where: {
          postId: post.id,
          userId: userId,
        },
      });

      return {
        ...post,
        isLike: like ? true : false,
      };
    })
  );

  const total = await prisma.post.count({
    where: {
      ...searchFilters,
      isDeleted: false,
    },
  });

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: postsWithLikeStatus,
  };
};


const getSinglePost = async (id: string) => {
  const post = await prisma.post.findUnique({
    where: {
      id: id,
      isDeleted: false,
    },
    include: {
      _count: {
        select: {
          Like: true,
          Comment: true,
          Share: true,
        },
      },
    },
  });
  if (!post) {
    throw new ApiError(httpStatus.NOT_FOUND, "Post not found");
  }
  return post;
};

const getPopularPosts = async (options: IPaginationOptions) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);

  const result = await prisma.post.findMany({
    where: {
      isDeleted: false,
    },
    orderBy: {
      Like: {
        _count: "desc",
      },
    },
    take: limit,
    skip,
    select: {
      id: true,
      image: true,
    },
  });

  const total = await prisma.post.count({
    where: {
      isDeleted: false,
    },
  });

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: result,
  };
};

const updatePost = async (id: string, payload: any, files: any) => {
  const post = await prisma.post.findUnique({
    where: {
      id: id,
    },
  });

  if (!post) {
    throw new ApiError(httpStatus.NOT_FOUND, "Post not found");
  }

  let image = post.image;

  if (files) {
    deleteFromS3ByUrl(image as string);
    const uploadResult = await fileUploader.uploadToDigitalOcean(files);
    image = uploadResult.Location;
  }

  const result = await prisma.post.update({
    where: {
      id: id,
    },
    data: {
      ...payload,
      image: image,
    },
  });

  return result;
};

const deletePost = async (id: string) => {
  const post = await prisma.post.findUnique({
    where: {
      id: id,
      isDeleted: false,
    },
  });

  if (!post) {
    throw new ApiError(httpStatus.NOT_FOUND, "Post not found");
  }

  const result = await prisma.post.update({
    where: {
      id: id,
    },
    data: {
      isDeleted: true,
    },
  });

  return;
};

export const PostServices = {
  createPost,
  getAllPosts,
  getSinglePost,
  getPopularPosts,
  updatePost,
  deletePost,
};
