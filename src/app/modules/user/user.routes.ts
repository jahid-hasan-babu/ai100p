import express from "express";
import auth from "../../middlewares/auth";
import { UserControllers } from "./user.controller";
import { fileUploader } from "../../helpers/fileUploader";
const router = express.Router();

router.post(
  "/register",
  fileUploader.uploadCertificateImage,
  UserControllers.registerUser
);

router.get("/", UserControllers.getAllUsers);

router.get("/seller", UserControllers.getAllSellerUsers);

router.get("/me", auth(), UserControllers.getMyProfile);

router.get("/:id", auth(), UserControllers.getUserDetails);
router.put(
  "/update-profile",
  auth("USER", "ADMIN", "SELLER"),
  UserControllers.updateMyProfile
);

router.put(
  "/update-status/:id",
  auth("SUPERADMIN", "ADMIN"),
  UserControllers.updateUserStatus
);

router.delete("/delete", auth("USER", "ADMIN"), UserControllers.deleteUser);




export const UserRouters = router;
