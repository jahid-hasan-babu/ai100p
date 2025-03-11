import express from "express";
import auth from "../../middlewares/auth";
import { UserControllers } from "./user.controller";
import { fileUploader } from "../../helpers/fileUploader";
import parseBodyData from "../../../helpers/parseBodyData";
const router = express.Router();

router.post(
  "/register",
  fileUploader.uploadMultipleImage,
  parseBodyData,
  UserControllers.registerUser
);

router.get("/", UserControllers.getAllUsers);

router.get("/seller", UserControllers.getAllSellerUsers);

router.get("/user", UserControllers.getAllCustomerUsers);

router.get("/me", auth(), UserControllers.getMyProfile);

router.get(
  "/single-seller/:id",
  auth("ADMIN", "SUPERADMIN"),
  UserControllers.getSingleSellerFromDB
);

router.get("/:id", auth(), UserControllers.getUserDetails);
router.put(
  "/update-profile",
  fileUploader.uploadMultipleImage,
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

router.post("/social-login", UserControllers.socialLogin);


export const UserRouters = router;
