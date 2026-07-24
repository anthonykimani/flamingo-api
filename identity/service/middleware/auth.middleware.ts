import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthUser {
  id?: string;
  address: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ status: 401, message: "Unauthorized", data: null, errors: ["Missing or invalid Authorization header"] });
    return;
  }

  const token = authHeader.slice(7);
  const secret = process.env.TOKEN_SECRET;

  if (!secret) {
    res.status(500).json({ status: 500, message: "Internal Server Error", data: null, errors: ["Server misconfiguration"] });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret) as AuthUser;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ status: 401, message: "Unauthorized", data: null, errors: ["Invalid or expired token"] });
  }
}
