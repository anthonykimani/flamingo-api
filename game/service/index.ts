import express from "express";
import http from "http";
import {Server} from "socket.io";
import dotenv from "dotenv";
import cors from "cors";
import corsOptions from "./configs/corsconfig";
import AppDataSource from "./configs/ormconfig";
import gameRoutes from "./routes/index.games"
import quizRoutes from "./routes/index.quizzes"
import playerRoutes from "./routes/index.players"
import questionRoutes from "./routes/index.questions"
import answerRoutes from "./routes/index.answers"


export const app = express();
export const server = http.createServer(app);
export const io = new Server(server)

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
app.disable("x-powered-by");
app.enable("trust proxy");
app.use(cors(corsOptions));
app.use(express.json());
app.use("/games", gameRoutes);
app.use("/quizzes", quizRoutes);
app.use("/players", playerRoutes);
app.use("/questions", questionRoutes);
app.use("/answers", answerRoutes);

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

AppDataSource.initialize()
  .then(() => {
    if (require.main === module) {
      startServer();
    } else {
      module.exports = startServer;
    }
  })
  .catch((error) => console.log(error));

async function startServer() {
  server.listen(process.env.PORT, () => {
    console.log("Listening on port %d.", process.env.PORT);
    console.log(
      `Express Started ${process.env.SERVICE_NAME} in ${app.get("env")}` +
        `mode on http://localhost:${process.env.PORT}`
    );
  });
}
