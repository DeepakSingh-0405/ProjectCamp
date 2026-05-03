import { body } from "express-validator";

const userRegisterValidator = ()=>{
    return [
        body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Email is invalid"),
    body("username")
      .trim()
      .notEmpty()
      .withMessage("Username is required")
      .isLowercase()
      .withMessage("Username must be in lower case")
      .isLength({ min: 3 })
      .withMessage("Username must be at least 3 characters long"),
    body("password").trim().notEmpty().withMessage("Password is required"),
    body("fullName").optional().trim(),
    ]
}

const userLoginValidator = ()=>{
  return [
      body("email").optional().isEmail().withMessage("Email is invalid"),
      body("password").notEmpty().withMessage("Password is required"),
    ];
}

const userChangePasswordValidator = ()=>{
  return [
    body("oldassword").notEmpty().withMessage("Old password is required"),
    body("newPassword").notEmpty().withMessage("New password is required"),
  ]
}

const userForgotPasswordValidator = ()=>{
  return [
    body("email").notEmpty().withMessage("Email is required").isEmail().withMessage("Email is invalid")
  ]
}

const userResetPasswordValidator = ()=>{
  return [
    body("newPassword").notEmpty().withMessage("New password is required")
  ]
}

export {
    userRegisterValidator,
    userLoginValidator,
    userChangePasswordValidator,
    userForgotPasswordValidator,
    userResetPasswordValidator
};