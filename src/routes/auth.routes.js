import { Router } from "express";
import { registerUser, loginUser, logoutUser, getCurrentUser, verifyEmail, resendEmailVerification, refreshAccessToken, forgotPasswordRequest, resetForgotPassword, changePassword } from "../controllers/auth.controllers.js";
import { userRegisterValidator, userLoginValidator, userForgotPasswordValidator, userResetPasswordValidator, userChangePasswordValidator } from "../validators/index.validator.js";
import { validate } from "../middlewares/validator.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()
//Unsecured routes
router.route("/register").post(userRegisterValidator(), validate, registerUser);
router.route("/login").post(userLoginValidator(), validate, loginUser);
router.route("/verify-email/:token").get(verifyEmail);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/forgot-password").post(userForgotPasswordValidator(), validate, forgotPasswordRequest);
router.route("/reset-password/:token").post(userResetPasswordValidator(), validate, resetForgotPassword);

//secured routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/resend-email-verification").post(verifyJWT, resendEmailVerification);
router.route("/change-password").post(userChangePasswordValidator(), validate, verifyJWT, changePassword);

export default router;