import { Server, Socket } from 'socket.io';
import type Redis from 'ioredis';
import { GameManager } from '../game/GameManager.js';
import type {
  CreateGamePayload,
  JoinGamePayload,
  DiscardToCribPayload,
  PlayCardPayload,
  SendChatPayload,
} from '@cribbage/shared';

export function setupSocketHandlers(io: Server, redis: Redis): GameManager {
  const gameManager = new GameManager(redis, io);

  io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('create_game', async (payload: CreateGamePayload) => {
      try {
        const result = await gameManager.createGame(socket, payload);
        socket.emit('game_created', result);
      } catch (error) {
        socket.emit('error', { message: (error as Error).message });
      }
    });

    socket.on('join_game', async (payload: JoinGamePayload) => {
      try {
        const result = await gameManager.joinGame(socket, payload);
        socket.join(payload.gameId);
        io.to(payload.gameId).emit('player_joined', result);
      } catch (error) {
        socket.emit('error', { message: (error as Error).message });
      }
    });

    socket.on('start_game', async ({ gameId }: { gameId: string }) => {
      try {
        const result = await gameManager.startGame(gameId);
        io.to(gameId).emit('game_started', result);
      } catch (error) {
        socket.emit('error', { message: (error as Error).message });
      }
    });

    socket.on('discard_to_crib', async (payload: DiscardToCribPayload) => {
      try {
        const result = await gameManager.discardToCrib(socket, payload);
        if (result) {
          io.to(payload.gameId).emit('game_updated', result);
        }
      } catch (error) {
        socket.emit('error', { message: (error as Error).message });
      }
    });

    socket.on('play_card', async (payload: PlayCardPayload) => {
      try {
        const result = await gameManager.playCard(socket, payload);
        if (result) {
          io.to(payload.gameId).emit('game_updated', result);
        }
      } catch (error) {
        socket.emit('error', { message: (error as Error).message });
      }
    });

    socket.on('pass', async ({ gameId }: { gameId: string }) => {
      try {
        const result = await gameManager.pass(socket, gameId);
        if (result) {
          io.to(gameId).emit('game_updated', result);
        }
      } catch (error) {
        socket.emit('error', { message: (error as Error).message });
      }
    });

    socket.on('continue_counting', async ({ gameId }: { gameId: string }) => {
      try {
        const result = await gameManager.continueToNextPhase(socket, gameId);
        if (result) {
          io.to(gameId).emit('game_updated', result);
        }
      } catch (error) {
        socket.emit('error', { message: (error as Error).message });
      }
    });

    socket.on('send_chat', async (payload: SendChatPayload) => {
      try {
        const playerId = gameManager.getPlayerId(socket);
        const playerName = await gameManager.getPlayerName(payload.gameId, playerId);
        io.to(payload.gameId).emit('chat_message', {
          id: `${Date.now()}-${playerId}`,
          playerId,
          playerName,
          message: payload.message,
          timestamp: Date.now(),
        });
      } catch (error) {
        socket.emit('error', { message: (error as Error).message });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      gameManager.handleDisconnect(socket);
    });
  });

  return gameManager;
}
