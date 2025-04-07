import express from "express";
import UserController from "../controllers/user.controller";

const router = express.Router();

router.post("/", UserController.users);


router.get("*", function (req, res) {
    res.setHeader("Content-Type", "application/json");
    res.status(200);
    return res.json({ service: process.env.SERVICE_NAME });
})

export default router;