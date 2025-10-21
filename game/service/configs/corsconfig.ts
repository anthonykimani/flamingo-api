import dotenv from "dotenv";

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const corsOptions = {
  origin: [
    "https://flamingo-web.vercel.app",
    "http://localhost:3000",          
  ],
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Apikey"],
  credentials: true, 
  optionsSuccessStatus: 200,
};
export default corsOptions;
