import { ApiError } from "../utils/api-error";
import { asyncHandler } from "../utils/async-handler";
import jwt from "jsonwebtoken";
import User from "../models/User.model.js";
import { ProjectMember } from "../models/projectMember.models.js";
import mongoose from "mongoose";

const verifyJwt = asyncHandler(async(req,res,next)=>{
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

const verifyRolePermission = (roles = []) => {
    asyncHandler(async (req,res,next) => {
        const {projectId} = req.params

        if(!projectId) throw new ApiError(400,"project id missing");
        const projectMember = ProjectMember.findOne(
            {
                project: new mongoose.Types.ObjectId(projectId),
                user: new mongoose.Types.ObjectId(req.user._id)
            }
        )
        if(!projectMember) throw new ApiError(400,"projectMember not found");

        const givenRoles = projectMember.roles
        if(!roles.includes(givenRoles)){
            throw new ApiError(400, "You do not have permission to perform this action")
        }
        next();
    })
}
export { verifyJwt, verifyRolePermission };