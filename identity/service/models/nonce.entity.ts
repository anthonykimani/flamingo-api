import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity("auth_nonces")
export class AuthNonce {
    @PrimaryColumn({ length: 256 })
    walletAddress: string;

    @Column({ length: 128 })
    nonce: string;

    @Column({ type: "timestamp" })
    expiresAt: Date;
}
