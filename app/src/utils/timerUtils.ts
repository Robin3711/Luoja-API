import { prisma } from "../model/db";
import { assert, number, string } from "superstruct";

export let timers: Record<string, { remainingTime: number, timer: NodeJS.Timeout }> = {};

export async function startTimer(gameId: string, duration: number): Promise<void> {

    // Validate the input
    assert(gameId, string());
    assert(duration, number());

    timers[gameId] = { remainingTime: duration, timer: 
        setInterval(async () => {
            timers[gameId].remainingTime --;

            if (timers[gameId].remainingTime === 0) {
                await prisma.game.update({
                    where: { id: gameId },
                    data: { questionCursor: { increment: 1 } }
                });
                clearInterval(timers[gameId].timer);
                delete timers[gameId];
            }
        }, 1000)
    };
}

export async function interruptTimer(gameId: string): Promise<void> {
    clearTimeout(timers[gameId].timer);
    delete timers[gameId];
}

export function hasActiveTimer(gameId: string): boolean {
    return timers[gameId] !== undefined;
}