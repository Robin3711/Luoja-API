import { prisma } from "../model/db";
import { assert, number, string } from "superstruct";
import * as roomUtils from "./roomUtils";

export let timers: Record<string, { remainingTime: number, active: boolean, timer: NodeJS.Timeout }> = {};

export async function startTimer(gameId: string, duration: number): Promise<void> {

    // Validate the input
    assert(gameId, string());
    assert(duration, number());

    timers[gameId] = { remainingTime: duration, active: true, timer: 
        setInterval(async () => {
            timers[gameId].remainingTime --;

            if (timers[gameId].remainingTime === 0) {

                await prisma.game.update({
                    where: { id: gameId },
                    data: { questionCursor: { increment: 1 } }
                });
                clearInterval(timers[gameId].timer);
            }
        }, 1000)
    };
}

export async function startRoomTimer(roomId: string, duration: number): Promise<void> {
    assert(roomId, string());
    assert(duration, number());

    timers[roomId] = { remainingTime: duration, active: true, timer: 
        setInterval(async () => {
            timers[roomId].remainingTime --;

            for (const client of roomUtils.sseClients[roomId]) {
                client.res.write(`data: ${JSON.stringify({ eventType: "timer", remainingTime: timers[roomId].remainingTime })}\n\n`);
            }

            if (timers[roomId].remainingTime === 0) {
                roomUtils.nextQuestion(roomId);
                clearInterval(timers[roomId].timer);
            }
        }, 1000)
    };

}

export async function interruptTimer(gameId: string): Promise<void> {
    timers[gameId].active = false;
    clearTimeout(timers[gameId].timer);
}

export function hasActiveTimer(gameId: string): boolean {
    return timers[gameId] !== undefined && timers[gameId].active;
}