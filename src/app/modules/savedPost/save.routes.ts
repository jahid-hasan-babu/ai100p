import express from "express";
import auth from "../../middlewares/auth";
import { SavedControllers } from "./save.controller";


const router = express.Router();

router.post("/:id", auth(), SavedControllers.savedPost);

router.get("/", auth(), SavedControllers.getMySavedPost);

router.delete("/:id", auth(), SavedControllers.unSavedPost);


export const SavedPostRouters = router;
