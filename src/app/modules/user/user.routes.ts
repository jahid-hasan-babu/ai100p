import express from "express";
import auth from "../../middlewares/auth";
import { UserControllers } from "./user.controller";
const router = express.Router();

router.post("/register", UserControllers.registerUser);

router.get("/", auth("ADMIN", "SUPERADMIN"), UserControllers.getAllUsers);

router.get(
  "/me",
  auth("USER", "ADMIN", "SUPERADMIN"),
  UserControllers.getMyProfile
);

router.get("/:id", auth(), UserControllers.getUserDetails);
router.put(
  "/update-profile",
  auth("USER", "ADMIN"),
  UserControllers.updateMyProfile
);

router.put(
  "/update-status/:id",
  auth("SUPERADMIN", "ADMIN"),
  UserControllers.updateUserStatus
);

router.delete("/delete", auth("USER", "ADMIN"), UserControllers.deleteUser);




export const UserRouters = router;
