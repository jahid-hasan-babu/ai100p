import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { authValidation } from "./auth.validation";
import { AuthControllers } from "./auth.controller";
const router = express.Router();

router.post(
  '/login',
  validateRequest(authValidation.loginUser),
  AuthControllers.loginUser,
);


router.post(
  "/forgot-password",
  validateRequest(authValidation.forgotPassword),
  AuthControllers.forgotPassword
);

router.post(
  "/verify-otp",
  validateRequest(authValidation.verifyOtp),
  AuthControllers.verifyOtp
);

router.post(
  "/change-password",
  validateRequest(authValidation.changePassword),
  AuthControllers.changePassword
);


export const AuthRouters = router;
