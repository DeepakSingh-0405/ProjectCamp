import { ApiError } from "../utils/api-error";
import { asyncHandler } from "../utils/async-handler";
import jwt from "jsonwebtoken";
import User from "../models/User.model.js";

const verifyJwt = asyncHandler((req,res,next)=>{
    const token = req.cookie?.access_token || Header("Authorization").replace("Bearer ","");
    if(!token) throw new ApiError(401,"Unauthorized request",[]);

    try {
        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
        const user = User.findById(decodedToken?._id).select(
            "-password -emailVerificationToken -refreshToken -emailVerificationExpiry"
        )
        if(!user) throw new ApiError(401,"invalid access token",[]);
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401,"invalid access token",[]);
    }
})