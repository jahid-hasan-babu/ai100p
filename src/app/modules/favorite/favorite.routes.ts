import express from "express";
import auth from "../../middlewares/auth";
import { FavoriteControllers } from "./favorite.controller";


const router = express.Router();

router.post("/:id", auth(), FavoriteControllers.addFavorite);

router.get("/", auth(), FavoriteControllers.getMyFavoriteArtist);

router.get("/who-favorite-me", auth(), FavoriteControllers.getWhoFavoriteMe);

router.delete("/:id", auth(), FavoriteControllers.removeArtist);


export const FavoriteRouters = router;
