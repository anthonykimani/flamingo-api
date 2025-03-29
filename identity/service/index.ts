import express from "express";
import http from "http";
import dotenv from "dotenv";
import cors from "cors";
import corsOptions from "./configs/corsconfig";
import AppDataSource from "./configs/ormconfig";

import usersRoutes from "./routes/index.users";

export const app = express();
export const server = http.createServer(app);

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
app.disable("x-powered-by");
app.enable("trust proxy");
app.use(cors(corsOptions));
app.use(express.json());
app.use("/users", usersRoutes);

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
