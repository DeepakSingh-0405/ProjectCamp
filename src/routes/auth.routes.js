import {Router} from"express";
import { registerUser, loginUser} from "../controllers/auth.controllers.js";
import { userRegisterValidator, userLoginValidator } from "../validators/index.validator.js";
import {validate} from "../middlewares/validator.middleware.js"

const router = Router()
router.route("/register").post(userRegisterValidator(), validate, registerUser);
router.route("/login").post(userLoginValidator(), validate, loginUser);

export default router;