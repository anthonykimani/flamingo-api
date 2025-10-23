import express from "express";
import http from "http";
import dotenv from "dotenv";
import cors from "cors";
import corsOptions, { allowedOrigins } from "./configs/corsconfig";
import AppDataSource from "./configs/ormconfig";
import gameRoutes from "./routes/index.games";
import quizRoutes from "./routes/index.quizzes";
import playerRoutes from "./routes/index.players";
import questionRoutes from "./routes/index.questions";
import answerRoutes from "./routes/index.answers";
import { SocketService } from "./utils/socket/app.socket.manager";

// Load environment variables
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

// Create Express app
export const app = express();

// Create HTTP server
export const server = http.createServer(app);

// Initialize Socket.IO service - FIX: Use getInstance()
const socketService = SocketService.getInstance();
export const io = socketService.initialize(server, allowedOrigins);

// Express middleware
app.disable("x-powered-by");
app.enable("trust proxy");
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use("/games", gameRoutes);
app.use("/quizzes", quizRoutes);
app.use("/players", playerRoutes);
app.use("/questions", questionRoutes);
app.use("/answers", answerRoutes);

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
        
        if (require.main === module) {
            startServer();
        } else {
            module.exports = startServer;
        }
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