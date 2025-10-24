export enum SocketEvents {
    // Connection
    CONNECTION = 'connection',
    DISCONNECT = 'disconnect',
    
    // Game Flow
    JOIN_GAME = 'join-game',
    LEAVE_GAME = 'leave-game',
    START_GAME = 'start-game',
    GAME_STARTED = 'game-started',
    
    // Player Events
    PLAYER_JOINED = 'player-joined',
    PLAYER_LEFT = 'player-left',
    PLAYER_DISCONNECTED = 'player-disconnected',
    JOINED_GAME = 'joined-game',
    
    // Question Flow
    QUESTION_STARTED = 'question-started',
    NEXT_QUESTION = 'next-question',
    SUBMIT_ANSWER = 'submit-answer',
    ANSWER_SUBMITTED = 'answer-submitted',
    PLAYER_ANSWERED = 'player-answered',
    
    // Results
    SHOW_RESULTS = 'show-results',
    QUESTION_RESULTS = 'question-results',
    END_GAME = 'end-game',
    GAME_ENDED = 'game-ended',
    
    // Utility
    ERROR = 'error',
    PING = 'ping',
    PONG = 'pong'
}