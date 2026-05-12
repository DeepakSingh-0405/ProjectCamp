import { Router } from "express";
import {
    deleteMember,
    updateMemberRole,
    getProjectById,
    getProjectMembers,
    addProjectMembers,
    deleteProject,
    updateProject,
    createProject,
    getProjects
} from "../controllers/project.controllers.js";
import {
    projectCreateValidator,
    addMemberToProjectValidator,
    updateMemberRoleValidator
} from "../validators/index.validator.js";
import { validate } from "../middlewares/validator.middleware.js"
import { verifyJWT, verifyRolePermission } from "../middlewares/auth.middleware.js";
import { AvailableUserRoles, UserRolesEnum } from "../utils/constants.js";

const router = Router()
router.use(verifyJWT)

router.route("/")
    .get(getProjects)
    .post(projectCreateValidator(), validate, createProject);

router.route("/:projectId")
    .get(verifyRolePermission(AvailableUserRoles),getProjectById)
    .put(verifyRolePermission([UserRolesEnum.ADMIN]),updateProject)
    .delete(verifyRolePermission([UserRolesEnum.ADMIN]),deleteProject)

router.route("/:projectId/members")
    .get(getProjectMembers)
    .post(verifyRolePermission([UserRolesEnum.ADMIN]),addMemberToProjectValidator(), validate, addProjectMembers);

router.route("/:projectId/members/:userId")
    .put(verifyRolePermission([UserRolesEnum.ADMIN]),updateMemberRoleValidator(), validate, updateMemberRole)
    .delete(verifyRolePermission([UserRolesEnum.ADMIN]),deleteMember)


export default router;