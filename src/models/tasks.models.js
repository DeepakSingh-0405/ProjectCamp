import mongoose, {Schema} from "mongoose";
import { TaskStatusEnum,AvailableTaskStatus } from "../utils/constants";
const taskSchema = new Schema({
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
    project:{
        type: Schema.Types.ObjectId,
        ref:"Project",
        required:true
    },
    assignedBy:{
        type: Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    assignedTo:{
        type: Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    role:{
        type: String,
        enum:AvailableTaskStatus,
        default:TaskStatusEnum.TODO
    },
    attachments:{
        type: [{
            url:String,
            MimeType:String,
            size:Number
        }],
        default: []
    }
},{timestamps:true})

export const Task = mongoose.model("Task",taskSchema)