import { User } from '../models/user.models.js';
import { ApiResponse } from '../utils/api-response.js';
import { ApiError } from '../utils/api-error.js';
import { asyncHandler } from '../utils/async-handler.js';
import { Project } from '../models/project.models.js';
import { ProjectMember } from '../models/projectMember.models.js'
import {Task} from '../models/tasks.models.js'
import {SubTask} from '../models/subTasks.models.js'
import mongoose from 'mongoose';
import { AvailableUserRoles, UserRolesEnum, AvailableTaskStatus, TaskStatusEnum } from '../utils/constants.js';

const getTasks = asyncHandler(async(req,res) => {
    const {projectId} = req.params;
    const project = Project.findById(new mongoose.Types.ObjectId(projectId))
    if(!project) throw new ApiError(404,"project not found");

    const tasks = Task .find({
        project: new mongoose.Types.ObjectId(projectId)
    }).populate("assignedTo", "avatar username fullName")

    if(!tasks) throw new ApiError(404,"tasks not found");
    res.status(200)
    .json(
        new ApiResponse(200,tasks,"tsaks fetched successfully")
    )
})

const getTaskById = asyncHandler(async(req,res) => {
    const { taskId } = req.params;
    
      const task = await Task.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(taskId),
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "assignedTo",
            foreignField: "_id",
            as: "assignedTo",
            pipeline: [
              {
                _id: 1,
                username: 1,
                fullName: 1,
                avatar: 1,
              },
            ],
          },
        },
        {
          $lookup: {
            from: "subtasks",
            localField: "_id",
            foreignField: "task",
            as: "subtasks",
            pipeline: [
              {
                $lookup: {
                  from: "users",
                  localField: "createdBy",
                  foreignField: "_id",
                  as: "createdBy",
                  pipeline: [
                    {
                      $project: {
                        _id: 1,
                        username: 1,
                        fullName: 1,
                        avatar: 1,
                      },
                    },
                  ],
                },
              },
              {
                $addFields: {
                  createdBy: {
                    $arrayElemAt: ["$createdBy", 0],
                  },
                },
              },
            ],
          },
        },
        {
          $addFields: {
            assignedTo: {
              $arrayElemAt: ["$assignedTo", 0],
            },
          },
        },
      ]);
    
      if (!task || task.length === 0) {
        throw new ApiError(404, "Task not found");
      }
      return res
        .status(200)
        .json(new ApiResponse(200, task[0], "Task fetched successfully"));
})

const createTask= asyncHandler(async(req,res) => {
    const {title, description, assignedTo, status} = req.body
    const {projectId} = req.params
    const project = await Project.findById(new mongoose.Types.ObjectId(projectId))
    if(!project) throw new ApiError(404, "project not found");

    const files = req.files || [];
    const attachments = files.map((file) => {
        return ({
            url: `${process.env.SERVER_URL}/images/${file.originalName}`,
            MimeType: file.mimetype,
            size: file.size
        });
    })

    const task = await Task.create({
        title,
        description,
        project: new mongoose.Types.ObjectId(projectId),
        assignedBy: new mongoose.Types.ObjectId(req.user._id),
        assignedTo: assignedTo ? new mongoose.Types.ObjectId(assignedTo) : undefined,
        status,
        attachments
    })
    if(!task) throw new ApiError(400, "task creation failed");
    res.status(200)
    .json(
        new ApiResponse(200, task, "task created successfully")
    )
})

const updateTask = asyncHandler(async(req,res) => {
    const {title, description, assignedTo, status} = req.body
    const {taskId} = req.params
    const task = await Task.findById(new mongoose.Types.ObjectId(taskId))
    if(!task) throw new ApiError(404, "task not found");

    const files = req.files || [];
    const attachments = files.map((file) => {
        return ({
            url: `${process.env.SERVER_URL}/images/${file.originalName}`,
            MimeType: file.mimetype,
            size: file.size
        });
    })
    const data = {
        title,
        description,
        assignedBy: new mongoose.Types.ObjectId(req.user._id),
        status,
        attachments
    }

    if(assignedTo){data.assignedTo = new mongoose.Types.ObjectId(assignedTo);}

    const updatedTask = await Task.findByIdAndUpdate(
        new mongoose.Types.ObjectId(taskId),
        data,
        {new:true}
    )
    if(!updateTask) throw new ApiError(400, "task cannot be updated");
    res.status(200)
    .json(new ApiResponse(200, updatedTask, "task updated successfully"));
});

const deleteTask = asyncHandler(async(req,res) => {
    const {taskId} = req.params;
    const task = await Task.findById(new mongoose.Types.ObjectId(taskId))
    if(!task) throw new ApiError(404, "task not found");

    await Task.findByIdAndDelete(
        new mongoose.Types.ObjectId(taskId)
    )
    res.status(200)
    .json(
        new ApiResponse(200, null, "task deleted successfully")
    )
})

const createSubTask = asyncHandler(async(req,res) => {
    const {content, completed} = req.body;
    const {taskId} = req.params

    const task = await Task.findById(new mongoose.Types.ObjectId(taskId));
    if(!task) throw new ApiError(404, "task not found");

    const subTask = await SubTask.create({
        content,
        completed: completed || false,
        task: new mongoose.Types.ObjectId(taskId),
        createdBy: new mongoose.Types.ObjectId(req.user._id)
    })

    if(!subTask) throw new ApiError(400,"subtask creation failed");

    res.status(200)
    .json(
        new ApiResponse(200, subTask, "subtask created succesfully")
    )
})

const updateSubTask = asyncHandler(async(req,res) => {
    const {content, completed} = req.body;
    const {subtaskId} = req.params

    const subtask = await SubTask.findById(new ongoose.Types.ObjectId(subtaskId))
    if(!subtask) throw new ApiError(404, "subtask not found");

    const subTask = await SubTask.findByIdAndUpdate(
        new mongoose.Types.ObjectId(subtaskId),
        {
        content,
        completed: completed || false,
        createdBy: new mongoose.Types.ObjectId(req.user._id)
        },
        {new:true}
    )

    if(!subTask) throw new ApiError(400,"subtask updation failed");

    res.status(200)
    .json(
        new ApiResponse(200, subTask, "subtask updated succesfully")
    )
})

const deleteSubTask = asyncHandler(async(req,res) => {
    const {subtaskId} = req.params;
    const subtask = SubTask.findById(new mongoose.Types.ObjectId(subtaskId));
    if(!subtask) throw new ApiError(404, "subtask not found");

    await SubTask.findByIdAndDelete(new mongoose.Types.ObjectId(subtaskId));

    res.status(200)
    .json(
        new ApiResponse(200, null, "subtask deleted successfully")
    )
})