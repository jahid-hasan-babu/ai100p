import prisma from "../../utils/prisma";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";
import { IPaginationOptions } from "../../interface/pagination.type";
import { paginationHelper } from "../../../helpers/paginationHelper";



const follow = async (userId: string, followingId: string) => {

  if(userId === followingId){
    throw new ApiError(httpStatus.BAD_REQUEST, "You cannot follow yourself");  
  }

  const existingFollow = await prisma.follower.findFirst({
    where: {
      followerId: userId,
      followingId: followingId,
    },
  });

  if (existingFollow) {
    throw new ApiError(httpStatus.BAD_REQUEST, "You have already followed this user");
  }
  const follow = await prisma.follower.create({
    data: {
      followerId: userId,
      followingId: followingId,
    },
  });
  return follow;
}

const unFollow = async (userId: string, followingId: string) => {

  const existingFollow = await prisma.follower.findFirst({
    where: {
      followerId: userId,
      followingId: followingId,
    },
  })

  if (!existingFollow) {
    throw new ApiError(httpStatus.BAD_REQUEST, "You have not followed this user");
  }
  const follow = await prisma.follower.deleteMany({
    where: {
      followerId: userId,
      followingId: followingId,
    },
  });
  return ;
}

const getMyFollowers = async (userId: string, options: IPaginationOptions) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const followers = await prisma.follower.findMany({
    where: {
      followingId: userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
    skip,
    select: {
      follower: {
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
      total: await prisma.follower.count({ where: { followingId: userId } }),
      page,
      limit,
    },
    data:followers,
  };
};

const getMyFollowing = async (userId: string, options: IPaginationOptions) => { 
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const following = await prisma.follower.findMany({
    where: {
      followerId: userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
    skip,
    select: {
      following: {
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
      total: await prisma.follower.count({ where: { followerId: userId } }),
      page,
      limit,
    },
    data:following,
  };
}

export const FollowServices = {
  follow,
  unFollow,
  getMyFollowers,
  getMyFollowing,
};
