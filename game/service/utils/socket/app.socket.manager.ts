import { GameRepository } from "../../repositories/game.repo";
import { ServerOptions, Server as SocketServer, Socket } from "socket.io";
import { Server as HttpServer } from "http";

export class SocketManager {
    private static instance: SocketManager
    private io: SocketServer | null = null;
    protected gameRepo: GameRepository = new GameRepository();

    private constructor () {

    }

    static getInstance(): SocketManager{
        if(!SocketManager.instance) {
            SocketManager.instance = new SocketManager();
        }
        return SocketManager.instance;
    }

    initialize(httpServer: HttpServer, opts?: Partial<ServerOptions>) {
        try {
            if(!this.io) {
                this.io = new SocketServer(httpServer, { ...opts });

                if (this.io) {
                    this.setupEventListeners();
                }
            }

            return this.io;
        } catch (error) {
            new Exception("Socket.IO has not been initialized.", 500, "Major", error, "initialize");
        }
    }
}