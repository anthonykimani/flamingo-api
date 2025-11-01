import { baseSepolia } from "viem/chains";
import { createClients } from "../shared/helpers";
import { Address, encodeAbiParameters, erc20Abi, getContract, Hex, keccak256, stringToHex } from "viem";
import { flamingoEscrowABI } from "../abi/flamingo-escrow";
import * as dotenv from "dotenv";

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const {
    FLAMINGO_ESCROW_ADDRESS,
    USDC_ADDRESS
} = process.env

export class FlamingoEscrowService {
    private publicClient;
    private walletClient;
    private account;
    private flamingoEscrowContract;
    private usdcContract;
    private chain;
    private flamingoEscrowAddress: Address;


    constructor() {
        const { publicClient, deployer, account, chainId } = createClients();

        this.publicClient = publicClient;
        this.walletClient = deployer;
        this.account = account;
        this.chain = chainId;

        const flamingoEscrowAddress = FLAMINGO_ESCROW_ADDRESS;
        const usdcAddress = USDC_ADDRESS;


        if (!flamingoEscrowAddress || !usdcAddress) {
            throw new Error("Missing contract addresses in environment");
        }

        this.flamingoEscrowAddress = flamingoEscrowAddress as Address;

        // Initialize contracts
        this.flamingoEscrowContract = getContract({
            address: flamingoEscrowAddress as Address,
            abi: flamingoEscrowABI,
            client: { public: this.publicClient, wallet: this.walletClient }
        });

        this.usdcContract = getContract({
            address: usdcAddress as Address,
            abi: erc20Abi,
            client: { public: this.publicClient, wallet: this.walletClient }
        })

        console.log('🔗 Blockchain service initialized');
        console.log('Chain:', this.chain.name);
        console.log('FlamingoEscrowAddress:', flamingoEscrowAddress);
        console.log('USDC:', usdcAddress);
        console.log('Backend Signer:', this.account.address);

    }

    private hashUUID(uuid: string): Hex {
        return keccak256(stringToHex(uuid));
    }

    /**
     * Lock Deposits when game starts
     */
    async createGameSession(sessionId: string, players: Array<{ walletAddress: string }>) {
        const gameSessionId = this.hashUUID(sessionId);
        const playerAddresses = players.map(player => player.walletAddress as Address);

        console.log(` Locking deposits for ${players.length} players...`);

        const hash = await this.walletClient.writeContract({
            address: this.flamingoEscrowAddress,
            abi: flamingoEscrowABI,
            functionName: 'createGameSession',
            args: [gameSessionId, playerAddresses],
            account: this.account,
            chain: this.chain
        });

        const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

        console.log(`✅ Locked on-chain: ${hash}`);

        return {
            txHash: hash,
            blockNumber: receipt.blockNumber.toString(),
            gasUsed: receipt.gasUsed.toString(),
        }
    }

    /**
     * Distribute prizes when game ends
     */
    async distributePrizes(sessionId: string, winners: [string, string, string]) {
        const gameSessionId = this.hashUUID(sessionId);
        const winnerAddresses = winners as [Address, Address, Address];

        console.log(`🏆 Distributing prizes to 3 winners...`);

        // Create Signature
        const messageHash = keccak256(
            encodeAbiParameters(
                [
                    { type: 'address' },
                    { type: 'uint256' },
                    { type: 'bytes32' },
                    { type: 'address' },
                    { type: 'address' },
                    { type: 'address' }
                ],
                [
                    this.flamingoEscrowAddress,
                    BigInt(this.chain.id),
                    gameSessionId,
                    winnerAddresses[0],
                    winnerAddresses[1],
                    winnerAddresses[2]
                ]
            )
        );

        const signature = await this.account.signMessage({
            message: { raw: messageHash }
        });

        const hash = await this.walletClient.writeContract({
            address: this.flamingoEscrowAddress,
            abi: flamingoEscrowABI,
            functionName: 'distributePrizes',
            args: [gameSessionId, winnerAddresses, signature],
            account: this.account,
            chain: this.chain
        });

        const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

        console.log(`✅ Prizes sent: ${hash}`);

        return {
            txHash: hash,
            blockNumber: receipt.blockNumber.toString(),
            gasUsed: receipt.gasUsed.toString()
        }
    }


    /**
     * Cancel a game session
     */
    async cancelGameSession(sessionId: string) {
        const gameSessionId = this.hashUUID(sessionId);

        console.log(`❌ Cancelling game...`);

        const hash = await this.walletClient.writeContract({
            address: this.flamingoEscrowAddress,
            abi: flamingoEscrowABI,
            functionName: 'cancelGameSession',
            args: [gameSessionId],
            account: this.account,
            chain: this.chain
        });

        const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

        console.log(`✅ Game cancelled: ${hash}`);

        return {
            txHash: hash,
            blockNumber: receipt.blockNumber.toString(),
        };
    }


    // ==============================
    //  QUERY METHODS


    /**
     * Check if player has deposited
     */
    async checkPlayerDeposit(sessionId: string, playerAddress: string): Promise<boolean> {
        const gameSessionId = this.hashUUID(sessionId);

        const amount = await this.publicClient.readContract({
            address: this.flamingoEscrowAddress,
            abi: flamingoEscrowABI,
            functionName: 'getPendingDeposit',
            args: [gameSessionId, playerAddress as Address]
        }) as bigint;

        return amount > BigInt(0);
    }

    /**
     * Get Game info from contract
     */
    async getGameInfo(sessionId: string) {
        const gameSessionId = this.hashUUID(sessionId);

        const result = await this.publicClient.readContract({
            address: this.flamingoEscrowAddress,
            abi: flamingoEscrowABI,
            functionName: 'getGameInfo',
            args: [gameSessionId]
        }) as [bigint, bigint, Address[], boolean, boolean];

        const [prizePool, platformFee, players, paidOut, cancelled] = result;

        return {
            prizePool: prizePool.toString(),
            platformFee: platformFee.toString(),
            players,
            paidOut,
            cancelled,
            totalPlayers: players.length
        };
    }

    /**
     * Check if game exists on-chain
     */
    async gameExists(sessionId: string): Promise<boolean> {
        const gameSessionId = this.hashUUID(sessionId);

        const exists = await this.publicClient.readContract({
            address: this.flamingoEscrowAddress,
            abi: flamingoEscrowABI,
            functionName: 'gameExists',
            args: [gameSessionId]
        }) as boolean;

        return exists;
    }

    /**
     * Get contract addresses
     */
    getContractAddresses() {
        return {
            escrow: this.flamingoEscrowAddress,
            usdc: this.usdcContract.address,
            chain: this.chain.name,
            chainId: this.chain.id,
            backendSigner: this.account.address
        }
    }
}

export const flamingoEscrowService = new FlamingoEscrowService();