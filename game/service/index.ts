import express from "express";
import http from "http";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import corsOptions from "./configs/corsconfig";
import AppDataSource from "./configs/ormconfig";
import gameRoutes from "./routes/index.games";
import quizRoutes from "./routes/index.quizzes";
import playerRoutes from "./routes/index.players";
import questionRoutes from "./routes/index.questions";
import answerRoutes from "./routes/index.answers";
import authRoutes from "./routes/index.auth";
import { SocketService } from "./utils/socket/app.socket.manager";
import { validateEnv } from "./configs/env.config";

// Load environment variables
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

// Fail fast if required env vars are missing
validateEnv();

// Create Express app
export const app = express();

// Create HTTP server
export const server = http.createServer(app);

// Initialize Socket.IO service - FIX: Use getInstance()
const socketService = SocketService.getInstance();
export const io = socketService.initialize(server);

// Express middleware
app.disable("x-powered-by");
// Trust only the first proxy hop — `true` lets clients spoof X-Forwarded-For
// and bypass IP-based rate limiting (express-rate-limit rejects it).
app.set("trust proxy", 1);
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());

// Rate limiting on sensitive endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { status: 429, message: "Too many requests", data: null, errors: ["Rate limit exceeded"] },
});
const joinLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { status: 429, message: "Too many requests", data: null, errors: ["Rate limit exceeded"] },
});
app.use("/auth", authLimiter);
app.use("/games/join", joinLimiter);

// Routes
app.use("/games", gameRoutes);
app.use("/quizzes", quizRoutes);
app.use("/players", playerRoutes);
app.use("/questions", questionRoutes);
app.use("/answers", answerRoutes);
app.use("/auth", authRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
    res.status(200).json({ 
        status: "ok", 
        service: process.env.SERVICE_NAME,
        timestamp: new Date().toISOString()
    });
});

// Initialize database and start server
AppDataSource.initialize()
    .then(() => {
        console.log("Database initialized successfully");
        
        startServer();
    })
    .catch((error) => {
        console.error("Error initializing database:", error);
        process.exit(1);
    });

async function startServer() {
    const PORT = process.env.PORT;
    
    server.listen(PORT, () => {
        console.log("═".repeat(50));
        console.log(`🚀 Server: ${process.env.SERVICE_NAME}`);
        console.log(`📍 Port: ${PORT}`);
        console.log(`🌍 Environment: ${app.get("env")}`);
        console.log(`🔗 URL: http://localhost:${PORT}`);
        console.log(`🔌 WebSocket: Enabled`);
        console.log("═".repeat(50));
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
        console.log('SIGTERM received, shutting down gracefully...');
        server.close(() => {
            console.log('Server closed');
            AppDataSource.destroy();
            process.exit(0);
        });
    });
}