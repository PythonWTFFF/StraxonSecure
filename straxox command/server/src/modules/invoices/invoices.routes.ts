import { Router } from "express";
import { getInvoices, getInvoiceById, createInvoice, updateInvoice, deleteInvoice, renderInvoicePDF } from "./invoices.controller";
import { authenticateJWT, requireRole } from "../../middleware/auth.middleware";

const router = Router();

// Protect all invoice routes
router.use(authenticateJWT);

router.get("/", getInvoices);
router.get("/:id", getInvoiceById);
router.post("/:id/render", renderInvoicePDF);
router.post("/", requireRole(["Owner", "Admin", "Finance"]), createInvoice);
router.put("/:id", requireRole(["Owner", "Admin", "Finance"]), updateInvoice);
router.delete("/:id", requireRole(["Owner", "Admin", "Finance"]), deleteInvoice);

export default router;
