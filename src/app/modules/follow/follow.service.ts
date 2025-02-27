import prisma from "../../utils/prisma";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";
import { IPaginationOptions } from "../../interface/pagination.type";
import { paginationHelper } from "../../../helpers/paginationHelper";
import { notificationServices } from "../notifications/notification.service";

const follow1 = async (userId: string, followingId: string) => {
  if (userId === followingId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "You cannot follow yourself");
  }

  const existingFollow = await prisma.follower.findFirst({
    where: {
      followerId: userId,
      followingId: followingId,
    },
  });

  if (existingFollow) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You have already followed this user"
    );
  }
  const follow = await prisma.follower.create({
    data: {
      followerId: userId,
      followingId: followingId,
    },
  });
  return follow;
};

const follow = async (userId: string, followingId: string) => {
  if (userId === followingId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "You cannot follow yourself");
  }

  // Check if the follow relationship already exists
  const existingFollow = await prisma.follower.findFirst({
    where: {
      followerId: userId,
      followingId: followingId,
    },
  });

  if (existingFollow) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You have already followed this user"
    );
  }

  // Create the new follow relationship
  const follow = await prisma.follower.create({
    data: {
      followerId: userId,
      followingId: followingId,
    },
  });

  // Check if the followed user is already following back
  const isFollowingBack = await prisma.follower.findFirst({
    where: {
      followerId: followingId,
      followingId: userId,
    },
  });

  if (!isFollowingBack) {
    // Fetch the followed user's FCM token
    const followedUser = await prisma.user.findUnique({
      where: { id: followingId },
      select: { fcmToken: true },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    if (followedUser?.fcmToken) {
      await notificationServices.sendSingleNotification({
        params: { userId: followingId },
        user: { id: userId },
        body: {
          title: "New Follower",
          body: `${user?.name} started followed you`,
        },
      });
    }
  }

  return follow;
};


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
