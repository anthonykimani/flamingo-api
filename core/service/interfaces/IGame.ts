type GameState = 'created' | 'waiting' | 'countdown' | 'in_progress' | 'results_ready' | 'payout' | 'completed';

interface Game {
    id: string;
    quizId: string;
    address: string;
    type: 'public' | 'private';
    entryFee: string;
    players: Player[];
    maxPlayers: number;
    status: GameState;
    createdAt: string;
    updatedAt: string;
}

interface Player {
    wallet: string;
    joinedAt: string;
    answers: Record<string, string>;
    score?: number;
    isWinner?: boolean;
}