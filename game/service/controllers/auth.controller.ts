import { Request, Response } from "express";
import Controller from "./controller";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { recoverAddress, hashMessage } from "viem";
import { verifySiweMessage } from "@worldcoin/minikit-js/siwe";

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

      const nonce = crypto.randomBytes(32).toString("hex");
      const expiresAt = Date.now() + NONCE_TTL_MS;

      // Key the nonce by its own value so the SIWE (World App) flow can look
      // it up without knowing the wallet address ahead of time.
      nonceStore.set(`nonce:${nonce}`, { nonce, expiresAt });

      if (walletAddress && typeof walletAddress === "string") {
        const normalized = walletAddress.toLowerCase();
        nonceStore.set(normalized, { nonce, expiresAt });

        const message = [
          "Sign in to Flamingo",
          "",
          `Wallet: ${normalized}`,
          `Nonce: ${nonce}`,
          `Issued: ${new Date().toISOString()}`,
        ].join("\n");

        return res.send(super.response(super._200, { nonce, message }));
      }

      return res.send(super.response(super._200, { nonce }));
    } catch (error) {
      return res.send(super.response(super._500, null, super.ex(error)));
    }
  }

  public static async verify(req: Request, res: Response) {
    try {
      const { walletAddress, signature, message, nonce, payload } = req.body;

      if (payload && nonce) {
        // World App (MiniKit walletAuth) SIWE flow — supports EIP-1271 smart accounts.
        // No walletAddress required: the address is derived from the SIWE payload.
        const stored = nonceStore.get(`nonce:${nonce}`);

        if (!stored) {
          return res.send(super.response(super._400, null, ["No nonce requested. Call /auth/nonce first"]));
        }

        if (Date.now() > stored.expiresAt) {
          nonceStore.delete(`nonce:${nonce}`);
          return res.send(super.response(super._400, null, ["Nonce expired. Request a new one"]));
        }

        let signer: string;

        try {
          const verification = await verifySiweMessage(payload, nonce);
          if (!verification.isValid) {
            return res.send(super.response(super._401, null, ["SIWE signature is invalid"]));
          }
          signer = verification.siweMessageData.address ?? payload.address;
        } catch (err: any) {
          return res.send(super.response(super._401, null, [err?.message || "SIWE verification failed"]));
        }

        const normalized = signer.toLowerCase();
        nonceStore.delete(`nonce:${nonce}`);
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
      }

      // Legacy wagmi ECDSA flow
      if (!walletAddress || typeof walletAddress !== "string") {
        return res.send(super.response(super._400, null, ["walletAddress is required"]));
      }

      if (!signature || !message) {
        return res.send(super.response(super._400, null, ["signature and message are required"]));
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

      let signer: string;

      try {
        signer = await recoverAddress({ hash: hashMessage(message), signature });
      } catch (err: any) {
        return res.send(super.response(super._401, null, [err?.message || "Signature verification failed"]));
      }

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
