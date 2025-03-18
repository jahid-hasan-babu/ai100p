import prisma from "../../utils/prisma";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";
import { IPaginationOptions } from "../../interface/pagination.type";
import { paginationHelper } from "../../../helpers/paginationHelper";


const addFavorite = async (userId: string, artistId: string) => {
  const existingFavorite = await prisma.favorite.findFirst({
    where: {
      userId: userId,
      artistId: artistId
    },
  })

  if (existingFavorite) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You have already favorite this artist"
    );
  }

  const favorite = await prisma.favorite.create({
    data: {
      userId: userId,
      artistId: artistId,
    },
  });
  return favorite;
};

const getMyFavoriteArtist = async (
  userId: string,
  options: IPaginationOptions
) => {

   const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const favoriteArtist = await prisma.favorite.findMany({
    where: {
      userId: userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
    skip,
    select: {
      id: true,
      createdAt: true,
      artist: {
        select: {
          id: true,
          name: true,
          profileImage: true,
          profileStatus: true,
        },
      },
    },
  });
  return {
    meta: {
      total: await prisma.favorite.count({
        where: {
          userId: userId,
        },
      }),
      page,
      limit,
    },
    data: favoriteArtist,
  };
};

const getWhoFavoriteMe = async (artistId: string, options: IPaginationOptions) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const favoriteArtist = await prisma.favorite.findMany({
    where: {
      artistId: artistId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: options.limit,
    skip,
    select: {
      id: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          profileImage: true,
          profileStatus: true,
        },
      },
    },
  });
  return {
    meta: {
      total: await prisma.favorite.count({
        where: {
          artistId: artistId,
        },
      }),
      page,
      limit,
    },
    data: favoriteArtist,
  };
}

const removeArtist = async (userId: string, favoriteId: string) => {
  const existingFavorite = await prisma.favorite.findFirst({
    where: {
      userId: userId,
      id: favoriteId
    },
  })

  if (!existingFavorite) {
    throw new ApiError(httpStatus.BAD_REQUEST, "You have not favorite this artist");
  }

  const favorite = await prisma.favorite.deleteMany({
    where: {
      userId: userId,
      id: favoriteId
    },
  })

  return
}


export const FavoriteServices = {
  addFavorite,
  getMyFavoriteArtist,
  getWhoFavoriteMe,
  removeArtist,
};
