import express from "express";
import auth from "../../middlewares/auth";
import { UserControllers } from "./user.controller";
import { fileUploader } from "../../helpers/fileUploader";
import parseBodyData from "../../../helpars/parseBodyData";
const router = express.Router();

router.post(
  "/register",
  fileUploader.uploadmultipeImage,
  parseBodyData,
  UserControllers.registerUser
);

router.get("/", UserControllers.getAllUsers);

router.get("/seller", UserControllers.getAllSellerUsers);

router.get("/me", auth(), UserControllers.getMyProfile);

router.get("/:id", auth(), UserControllers.getUserDetails);
router.put(
  "/update-profile",
  fileUploader.uploadmultipeImage,
  parseBodyData,
  auth("USER", "ADMIN", "SELLER"),
  UserControllers.updateMyProfile
);

router.put(
  "/update-status/:id",
  auth("SUPERADMIN", "ADMIN"),
  UserControllers.updateUserStatus
);

router.post(
  "/delete",
  auth("USER", "ADMIN", "SELLER"),
  UserControllers.deleteUser
);

router.post(
  "/notification-permission",
  auth("USER", "ADMIN", "SELLER"),
  UserControllers.notificationPermission
);

router.put(
  "/update-password",
  auth("USER", "ADMIN", "SELLER"),
  UserControllers.changePassword
);


export const UserRouters = router;
