import { expect } from "chai";
import jwt from "jsonwebtoken";

// Env must be set before importing the modules under test
process.env.TOKEN_SECRET = process.env.TOKEN_SECRET || "test-secret-for-auth-tests";
process.env.TOKEN_ISSUER = process.env.TOKEN_ISSUER || "flamingo-game";

import { signGuestToken, verifyToken, isGuestPayload } from "../utils/tokens";
import { authMiddleware, guestOrAuthMiddleware } from "../middleware/auth.middleware";

const SECRET = process.env.TOKEN_SECRET;

function mockReqRes(authHeader?: string) {
  const req: any = { headers: authHeader ? { authorization: authHeader } : {} };
  const res: any = {
    statusCode: 0,
    body: null as any,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: any) {
      this.body = payload;
      return this;
    },
  };
  return { req, res };
}

describe("Token utilities (production module)", () => {
  it("should sign and verify a guest token round-trip", () => {
    const token = signGuestToken({ playerId: "p1", playerName: "Alice", gameSessionId: "g1" });
    const payload = verifyToken(token);

    expect(payload).to.not.be.null;
    expect(isGuestPayload(payload)).to.be.true;
    if (isGuestPayload(payload)) {
      expect(payload.playerName).to.equal("Alice");
      expect(payload.gameSessionId).to.equal("g1");
    }
  });

  it("should verify a wallet token and discriminate it from guests", () => {
    const token = jwt.sign({ address: "0xabc", role: "player" }, SECRET, { issuer: "flamingo-game" });
    const payload = verifyToken(token);

    expect(payload).to.not.be.null;
    expect(isGuestPayload(payload)).to.be.false;
  });

  it("should reject tampered tokens", () => {
    const token = signGuestToken({ playerId: "p1", playerName: "Alice", gameSessionId: "g1" });
    const tampered = token.slice(0, -2) + "xx";
    expect(verifyToken(tampered)).to.be.null;
  });

  it("should reject tokens signed with a different secret", () => {
    const foreign = jwt.sign({ guest: true, playerId: "p1", playerName: "Eve", gameSessionId: "g1" }, "wrong-secret");
    expect(verifyToken(foreign)).to.be.null;
  });

  it("should reject garbage input", () => {
    expect(verifyToken("not-a-token")).to.be.null;
    expect(verifyToken("")).to.be.null;
  });
});

describe("authMiddleware (production middleware)", () => {
  it("should return 401 when Authorization header is missing", () => {
    const { req, res } = mockReqRes();
    let called = false;
    authMiddleware(req, res, () => { called = true; });

    expect(called).to.be.false;
    expect(res.statusCode).to.equal(401);
  });

  it("should return 401 for an invalid token", () => {
    const { req, res } = mockReqRes("Bearer garbage");
    let called = false;
    authMiddleware(req, res, () => { called = true; });

    expect(called).to.be.false;
    expect(res.statusCode).to.equal(401);
  });

  it("should return 401 for a GUEST token (wallet-only route)", () => {
    const guestToken = signGuestToken({ playerId: "p1", playerName: "Alice", gameSessionId: "g1" });
    const { req, res } = mockReqRes(`Bearer ${guestToken}`);
    let called = false;
    authMiddleware(req, res, () => { called = true; });

    expect(called).to.be.false;
    expect(res.statusCode).to.equal(401);
  });

  it("should accept a wallet token and attach req.user", () => {
    const token = jwt.sign({ address: "0xdef", role: "player" }, SECRET, { issuer: "flamingo-game" });
    const { req, res } = mockReqRes(`Bearer ${token}`);
    let called = false;
    authMiddleware(req, res, () => { called = true; });

    expect(called).to.be.true;
    expect(req.user?.address).to.equal("0xdef");
  });
});

describe("guestOrAuthMiddleware (production middleware)", () => {
  it("should return 401 when Authorization header is missing", () => {
    const { req, res } = mockReqRes();
    let called = false;
    guestOrAuthMiddleware(req, res, () => { called = true; });

    expect(called).to.be.false;
    expect(res.statusCode).to.equal(401);
  });

  it("should attach req.guest for guest tokens", () => {
    const guestToken = signGuestToken({ playerId: "p1", playerName: "Alice", gameSessionId: "g1" });
    const { req, res } = mockReqRes(`Bearer ${guestToken}`);
    let called = false;
    guestOrAuthMiddleware(req, res, () => { called = true; });

    expect(called).to.be.true;
    expect(req.guest?.playerName).to.equal("Alice");
    expect(req.user).to.be.undefined;
  });

  it("should attach req.user for wallet tokens", () => {
    const token = jwt.sign({ address: "0xdef", role: "player" }, SECRET, { issuer: "flamingo-game" });
    const { req, res } = mockReqRes(`Bearer ${token}`);
    let called = false;
    guestOrAuthMiddleware(req, res, () => { called = true; });

    expect(called).to.be.true;
    expect(req.user?.address).to.equal("0xdef");
    expect(req.guest).to.be.undefined;
  });
});
