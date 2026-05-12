import { User } from '../models/user.models.js';
import { ApiResponse } from '../utils/api-response.js';
import { ApiError } from '../utils/api-error.js';
import { asyncHandler } from '../utils/async-handler.js';
import { Project } from '../models/project.models.js';
import { ProjectMember } from '../models/projectMember.models.js'
import mongoose from 'mongoose';
import { AvailableUserRoles, UserRolesEnum } from '../utils/constants.js';

const createProject = asyncHandler(async(req, res) => {
    const { title, description } = req.body
    if (!title || !description) throw new ApiError(400, "title and description are required!");

    const project = await Project.create(
        {
            title,
            description,
            createdBy: new mongoose.Types.ObjectId(req.user._id)
        }
    )
    if (!project) throw new ApiError(400, "project not created");

    ProjectMember.create({
        user: new mongoose.Types.ObjectId(req.user._id),
        project: new mongoose.Types.ObjectId(project._id),
        role: UserRolesEnum.ADMIN
    })

    res.status(200)
        .josn(
            new ApiResponse(200, project, "project created successfuly")
        )
})

const updateProject = asyncHandler(async(req, res) => {
    const { title, description } = req.body
    const { projectId } = req.params

    const project = await Project.findByIdAndUpdate(projectId, {
        title,
        description,
        createdBy: mongoose.Types.ObjectId(req.user._id)
    }, { new: true })

    if (!project) throw new ApiError(404, "project not found");

    res.status(200)
        .josn(
            new ApiResponse(200, project, "project updated successfuly")
        )
})

const deleteProject = asyncHandler(async(req, res) => {
    const { projectId } = req.params

    Project.findByIdAndDelete(projectId);

    res.status(200)
        .json(
            new ApiResponse(200, {}, "project deleted successfuly")
        )
})

const getProjects = asyncHandler(async(req, res) => {
    const projects = Project.aggregate([
        {
            $match: {
                user: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "projects",
                localField: "project",
                foreignField: "_id",
                as: "projects",
                pipeline: [
                    {
                        $lookup: {
                            from: "projectmember",
                            localField: "_id",
                            foreignField: "project",
                            as: "projectMember",
                        }
                    },
                    {
                        $addFields: {
                            member: { $size: "projectMember" }
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$project"
        },
        {
            $project: {
                project: {
                    _id: 1,
                    title: 1,
                    description: 1,
                    createdBy: 1,
                    member: 1
                },
                role: 1,
                _id: 0
            }
        }
    ])

    res.status(200)
        .json(
            new ApiResponse(200, projects, "projects fetched successfuly")
        )
})

const getProjectById = asyncHandler(async(req, res) => {
    const { projectId } = req.params
    const project = Project.findById(projectId);

    if (!project) throw new ApiError(404, "project not found");

    res.status(200)
        .json(
            new ApiResponse(200, project, "project fetchewd successfuly")
        )
})

const addProjectMembers = asyncHandler(async(req, res) => {
    const { email, role } = req.body;
    const { projectId } = req.params;

    const user = User.findOne({ email });
    if (!user) throw new ApiError(404, "user not found");

    const projectMember = ProjectMember.findByIdAndUpdate(
        {
            user: new mongoose.Types.ObjectId(user._id),
            project: new mongoose.Types.ObjectId(projectId)
        },
        {
            user: new mongoose.Types.ObjectId(user._id),
            project: new mongoose.Types.ObjectId(projectId),
            role: role
        },
        {
            new: true,
            upsert: true
        }
    )

    res.status(200)
        .josn(
            new ApiResponse(200, projectMember, "member added succesasfuly")
        )

})

const getProjectMembers = asyncHandler(async(req, res) => {
    const { projectId } = req.params;
    const project = Project.findById(project._id);

    if (!project) throw new ApiError(404, "project not found");

    const projectMembers = ProjectMember.aggregate([
        {
            $match: {
                project: new mongoose.Types.ObjectId(projectId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "users",
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            username: 1,
                            fullNamne: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                user: {
                    $arrayElemAt: ["$user", 0]
                }
            }
        },
        {
            $project: {
                _id: 0,
                user: 1,
                project: 1,
                role: 1,
                createdBy: 1,
                updatedAt: 1
            }
        }
    ])

    res.status(200)
    .json(
        new ApiResponse(200, projectMembers, "project members fetched successfuly")
    )
})

const updateMemberRole = asyncHandler(async(req,res)=>{
    const {projectId, userId} = req.params
    const {newRole} = req.body

    const projectMember = await ProjectMember.findByIdAndUpdate(
        {
            user: new mongoose.Types.ObjectId(userId),
            project: new mongoose.Types.ObjectId(projectId)
        },
        {
            role:newRole
        },
        {new:true}
    )
    if(!projectMember) throw new ApiError(404, "project member not found");
    
    res.status(200)
    .json(
        new ApiResponse(200, projectMember, "member role updated successfuly")
    )
})

const deleteMember = asyncHandler(async(req,res) => {
    const {porjectId, userId} = req.params

    const projectMember = ProjectMember.findByIdAndDelete(
        {
            user: new mongoose.Types.ObjectId(userId),
            project: new mongoose.Types.ObjectId(projectId)
        }
    )

    if(!projectMember) throw new ApiError(404, "project member not found");

    res.status(200)
    .json(
        new ApiResponse(200,projectMember, "project member deleted successfuly")
    )
})

export {
    deleteMember,
    updateMemberRole,
    getProjectById,
    getProjectMembers,
    addProjectMembers,
    deleteProject,
    updateProject,
    createProject,
    getProjects
}