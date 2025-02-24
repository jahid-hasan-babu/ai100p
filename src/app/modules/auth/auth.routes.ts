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

router.post("/forgetPassword", AuthControllers.forgetPassword);

router.post("/verify-forget-otp", AuthControllers.verifyOTP);

router.post("/change-password", AuthControllers.changePassword);


export const AuthRouters = router;
