import { Request, Response } from "express";
import { User } from "../models/user.entity";
import { AuthNonce } from "../models/nonce.entity";
import { UserRepository } from "../repositories/user.repo";
import AppDataSource from "../configs/ormconfig";
import Controller from "./controller";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { recoverAddress, hashMessage } from "viem";
import { sanitizeUser } from "../utils/shared/sanitize";

const NONCE_TTL_MS = 5 * 60 * 1000;

class AuthController extends Controller {
  public static async nonce(req: Request, res: Response) {
    try {
      const { walletAddress } = req.body;

      if (!walletAddress || typeof walletAddress !== "string") {
        return res.send(super.response(super._400, null, ["walletAddress is required"]));
      }

      const normalized = walletAddress.toLowerCase();
      const nonce = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + NONCE_TTL_MS);

      const nonceRepo = AppDataSource.getRepository(AuthNonce);
      await nonceRepo.save({ walletAddress: normalized, nonce, expiresAt });

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
      const nonceRepo = AppDataSource.getRepository(AuthNonce);
      const stored = await nonceRepo.findOne({ where: { walletAddress: normalized } });

      if (!stored) {
        return res.send(super.response(super._400, null, ["No nonce requested. Call /auth/nonce first"]));
      }

      if (Date.now() > stored.expiresAt.getTime()) {
        await nonceRepo.delete({ walletAddress: normalized });
        return res.send(super.response(super._400, null, ["Nonce expired. Request a new one"]));
      }

      // The signed message must be bound to THIS wallet and THIS nonce,
      // otherwise any previously signed message could be replayed.
      if (
        typeof message !== "string" ||
        !message.includes(`Wallet: ${normalized}`) ||
        !message.includes(`Nonce: ${stored.nonce}`)
      ) {
        return res.send(super.response(super._400, null, ["Message does not match the issued nonce"]));
      }

      const signer = await recoverAddress({ hash: hashMessage(message), signature });

      if (signer.toLowerCase() !== normalized) {
        return res.send(super.response(super._401, null, ["Signature does not match wallet address"]));
      }

      // Single-use: burn the nonce only after all checks pass.
      await nonceRepo.delete({ walletAddress: normalized });

      const repo: UserRepository = new UserRepository();
      let user = await repo.getUserByAddress(normalized);

      if (!user) {
        const generatedUsername = `user_${normalized.slice(2, 10)}`;
        const randomPassword = crypto.randomBytes(32).toString("hex");

        const newUser = new User();
        newUser.address = normalized;
        newUser.username = generatedUsername;
        newUser.firstname = "";
        newUser.lastname = "";
        newUser.email = `${generatedUsername}@flamingo.placeholder`;
        newUser.password = randomPassword;
        newUser.onboardType = "NEW" as any;

        user = (await repo.saveUser(newUser)) || null;
      }

      if (!user) {
        return res.send(super.response(super._500, null, ["Failed to create user"]));
      }

      const tokenSecret = String(process.env.TOKEN_SECRET);
      const tokenIssuer = String(process.env.TOKEN_ISSUER);
      const tokenExpiry = Number(String(process.env.TOKEN_EXPIRY)) || 86400;

      const token = jwt.sign(
        { id: user.id, address: user.address, role: user.role },
        tokenSecret,
        { expiresIn: tokenExpiry, issuer: tokenIssuer }
      );

      return res.send(super.response(super._200, {
        token,
        user: sanitizeUser(user),
      }));
    } catch (error) {
      return res.send(super.response(super._500, null, super.ex(error)));
    }
  }
}

export default AuthController;
