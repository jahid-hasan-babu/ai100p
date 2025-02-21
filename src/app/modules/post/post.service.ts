import prisma from "../../utils/prisma";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";
import { fileUploader } from "../../helpers/fileUploader";
import { paginationHelper } from "../../../helpars/paginationHelper";
import { IPaginationOptions } from "../../interface/pagination.type";
import { searchFilter2 } from "../../utils/searchFilter";

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
  options: IPaginationOptions & { search?: string }
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

  const total = await prisma.post.count({
    where: {
      ...searchFilters,
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

const getSinglePost = async (id: string) => {
  const post = await prisma.post.findUnique({
    where: {
      id: id,
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

export const PostServices = {
  createPost,
  getAllPosts,
  getSinglePost,
};
