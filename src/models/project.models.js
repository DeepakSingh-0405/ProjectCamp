import mongoose, {Schema} from "mongoose";
import { UserRolesEnum,AvailableUserRoles } from "../utils/constants";

const projectSchema = new Schema({
    title:{
        type:String,
        required:true,
        trim:true
    },
    description:{
        type:String,
        required:true,
        trim:true
    },
    user:{
        type: Schema.Types.ObjectId,
        ref:"User",
        required:true
    }
},{timestamps:true})

export const Project = mongoose.model("Project",projectSchema)