import express from "express";
import AuthController from "../controllers/auth.controller";

const router = express.Router();

router.post("/nonce", AuthController.nonce);
router.post("/verify", AuthController.verify);

export default router;
