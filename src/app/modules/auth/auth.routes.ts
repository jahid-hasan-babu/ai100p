import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { authValidation } from "./auth.validation";
import { AuthControllers } from "./auth.controller";
const router = express.Router();



router.post("/verify-phone", AuthControllers.sendOtp);

router.post(
  "/login",
  validateRequest(authValidation.loginUser),
  AuthControllers.loginUser
);

router.post("/verify-otp", AuthControllers.verifyOtpMessage);

router.post(
  "/change-password",
  validateRequest(authValidation.changePassword),
  AuthControllers.changePassword
);


export const AuthRouters = router;
