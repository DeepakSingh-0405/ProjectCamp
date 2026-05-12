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

const projectCreateValidator = ()=>{
  return [
    body("title").trim().notEmpty().withMessage("title required"),
    body("description").trim().notEmpty().withMessage("description is required")
  ]
}

const addMemberToProjectValidator = ()=>{
  return [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("email is incorrect"),
    
    body("role")
      .trim()
      .notEmpty()
      .withMessage("role is required")
      .toUpperCase()
  ]
}

const updateMemberRoleValidator = ()=>{
  return [
    body("newRole")
      .trim()
      .notEmpty()
      .withMessage("role is required")
      .toUpperCase()
  ]
}
export {
    userRegisterValidator,
    userLoginValidator,
    userChangePasswordValidator,
    userForgotPasswordValidator,
    userResetPasswordValidator,
    projectCreateValidator,
    addMemberToProjectValidator,
    updateMemberRoleValidator
};