import { Router } from "express";
import { getTeam, inviteTeamMember, updateTeamMemberRole, removeTeamMember } from "./team.controller";
import { authenticateJWT, requireRole } from "../../middleware/auth.middleware";

const router = Router();
router.use(authenticateJWT);

router.get("/", getTeam);
router.post("/invite", requireRole(["Owner", "Admin"]), inviteTeamMember);
router.patch("/:id/role", requireRole(["Owner", "Admin"]), updateTeamMemberRole);
router.delete("/:id", requireRole(["Owner", "Admin"]), removeTeamMember);

export default router;
