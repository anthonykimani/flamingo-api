import express from "express";
import UserController from "../controllers/user.controller";

const router = express.Router();
const userController = new UserController();


router.post("/", async (req, res)=> {
    await UserController.user(req, res)
});


router.get("*", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.status(200);
    res.json({ service: process.env.SERVICE_NAME });
})

export default router;