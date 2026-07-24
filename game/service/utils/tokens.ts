import jwt from "jsonwebtoken";

/**
 * Two token types are accepted across the service:
 *  - WalletTokenPayload: issued by /auth/verify (or the identity service)
 *    after a wallet signature challenge. Used by hosts and wallet players.
 *  - GuestTokenPayload: issued by POST /games/join after presenting a valid
 *    game PIN. Binds the bearer to ONE player in ONE game session.
 */

export interface WalletTokenPayload {
    id?: string;
    address: string;
    role: string;
}

export interface GuestTokenPayload {
    guest: true;
    playerId: string;
    playerName: string;
    gameSessionId: string;
}

export type TokenPayload = WalletTokenPayload | GuestTokenPayload;

export function isGuestPayload(payload: TokenPayload | null | undefined): payload is GuestTokenPayload {
    return !!payload && (payload as GuestTokenPayload).guest === true;
}

export function signGuestToken(data: {
    playerId: string;
    playerName: string;
    gameSessionId: string;
}): string {
    const secret = String(process.env.TOKEN_SECRET);
    const issuer = String(process.env.TOKEN_ISSUER || "flamingo-game");

    return jwt.sign(
        { guest: true, ...data },
        secret,
        { expiresIn: "12h", issuer }
    );
}

export function verifyToken(token: string): TokenPayload | null {
    const secret = process.env.TOKEN_SECRET;
    if (!secret) return null;

    try {
        return jwt.verify(token, secret) as TokenPayload;
    } catch {
        return null;
    }
}
