import { Request, Response } from "express";
import Controller from "./controller";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { recoverAddress, hashMessage } from "viem";

interface NonceEntry {
  nonce: string;
  expiresAt: number;
}

const nonceStore = new Map<string, NonceEntry>();
const NONCE_TTL_MS = 5 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of nonceStore) {
    if (entry.expiresAt < now) nonceStore.delete(key);
  }
}, 60_000);

class AuthController extends Controller {
  public static async nonce(req: Request, res: Response) {
    try {
      const { walletAddress } = req.body;

      if (!walletAddress || typeof walletAddress !== "string") {
        return res.send(super.response(super._400, null, ["walletAddress is required"]));
      }

      const normalized = walletAddress.toLowerCase();
      const nonce = crypto.randomBytes(32).toString("hex");
      const expiresAt = Date.now() + NONCE_TTL_MS;

      nonceStore.set(normalized, { nonce, expiresAt });

      const message = [
        "Sign in to Flamingo",
        "",
        `Wallet: ${normalized}`,
        `Nonce: ${nonce}`,
        `Issued: ${new Date().toISOString()}`,
      ].join("\n");

      return res.send(super.response(super._200, { nonce, message }));
    } catch (error) {
      return res.send(super.response(super._500, null, super.ex(error)));
    }
  }

  public static async verify(req: Request, res: Response) {
    try {
      const { walletAddress, signature, message } = req.body;

      if (!walletAddress || !signature || !message) {
        return res.send(super.response(super._400, null, ["walletAddress, signature, and message are required"]));
      }

      const normalized = walletAddress.toLowerCase();
      const stored = nonceStore.get(normalized);

      if (!stored) {
        return res.send(super.response(super._400, null, ["No nonce requested. Call /auth/nonce first"]));
      }

      if (Date.now() > stored.expiresAt) {
        nonceStore.delete(normalized);
        return res.send(super.response(super._400, null, ["Nonce expired. Request a new one"]));
      }

      const signer = await recoverAddress({ hash: hashMessage(message), signature });

      if (signer.toLowerCase() !== normalized) {
        return res.send(super.response(super._401, null, ["Signature does not match wallet address"]));
      }

      nonceStore.delete(normalized);

      const tokenSecret = String(process.env.TOKEN_SECRET);
      const tokenIssuer = String(process.env.TOKEN_ISSUER);
      const tokenExpiry = Number(String(process.env.TOKEN_EXPIRY)) || 86400;

      const token = jwt.sign(
        { address: normalized, role: "player" },
        tokenSecret,
        { expiresIn: tokenExpiry, issuer: tokenIssuer }
      );

      return res.send(super.response(super._200, { token }));
    } catch (error) {
      return res.send(super.response(super._500, null, super.ex(error)));
    }
  }
}

export default AuthController;
