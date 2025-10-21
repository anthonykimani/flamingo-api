import dotenv from "dotenv";
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const corsOptions = {
  origin: [
    "https://flamingo-web.vercel.app",
    "https://www.flamingo-web.vercel.app",
    "http://localhost:3000",
  ],
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Apikey",
    "Accept",
    "Origin",
    "X-Requested-With",
  ],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

export default corsOptions;
