import { Request, Response, NextFunction } from "express";
import { verifyToken, isGuestPayload, WalletTokenPayload, GuestTokenPayload } from "../utils/tokens";

declare global {
  namespace Express {
    interface Request {
      user?: WalletTokenPayload;
      guest?: GuestTokenPayload;
    }
  }
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}

/** Requires a WALLET token (hosts / authenticated users). Guest tokens are rejected. */
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req);

  if (!token) {
    res.status(401).json({ status: 401, message: "Unauthorized", data: null, errors: ["Missing or invalid Authorization header"] });
    return;
  }

  const payload = verifyToken(token);

  if (!payload || isGuestPayload(payload)) {
    res.status(401).json({ status: 401, message: "Unauthorized", data: null, errors: ["Invalid or expired token"] });
    return;
  }

  req.user = payload;
  next();
}

/** Requires EITHER a wallet token OR a guest token (gameplay endpoints). */
export function guestOrAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req);

  if (!token) {
    res.status(401).json({ status: 401, message: "Unauthorized", data: null, errors: ["Missing or invalid Authorization header"] });
    return;
  }

  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({ status: 401, message: "Unauthorized", data: null, errors: ["Invalid or expired token"] });
    return;
  }

  if (isGuestPayload(payload)) {
    req.guest = payload;
  } else {
    req.user = payload;
  }
  next();
}
