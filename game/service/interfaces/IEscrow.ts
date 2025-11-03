export interface EscrowInfo {
    lockTxHash?: string;
    distributeTxHash?: string;
    isLocked?: boolean;
    isPaidOut?: boolean;
    lockedAt?: Date;
    distributedAt?: Date;
    bytes32Hash?: string; // Optional: store the hashed game session ID
}
