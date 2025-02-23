import httpStatus from "http-status";
import { FavoriteServices } from "./favorite.service";
import sendResponse from "../../utils/sendResponse";
import catchAsync from "../../utils/catchAsync";
import { Request, Response } from "express";



const addFavorite = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const artistId = req.params.id;
  const result = await FavoriteServices.addFavorite(userId, artistId); 

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Favorite added successfully",
    data: result,
  })
}) 

const getMyFavoriteArtist = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const options = req.query;
  const result = await FavoriteServices.getMyFavoriteArtist(userId, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Favorite artists retrieved successfully",
    data: result,
  });
});

const getWhoFavoriteMe = async (req: Request, res: Response) => {
  const artistId = req.user.id;
  const options = req.query;
  const result = await FavoriteServices.getWhoFavoriteMe(artistId, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Favorite artists retrieved successfully",
    data: result,
  });
}

const removeArtist = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const favoriteId = req.params.id;
  const result = await FavoriteServices.removeArtist(userId, favoriteId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Favorite artist removed successfully",
    data: result,
  });
});


export const FavoriteControllers = {
  addFavorite,
  getMyFavoriteArtist,
  getWhoFavoriteMe,
  removeArtist,
};
