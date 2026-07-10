import express from "express";
import { handleContactForm } from "../controllers/contact.controller.js";

const router = express.Router();

router.post("/", handleContactForm);

export default router;
