import { prisma } from "../model/db";
import { assert, number, string } from "superstruct";
import * as teamUtils from "../utils/teamUtils";

export let timers: Record<string, { remainingTime: number, active: boolean, timer: NodeJS.Timeout }> = {};

export async function startTimer(roomId: string, duration: number): Promise<void> {

    // Validate the input
    assert(roomId, string());
    assert(duration, number());

    timers[roomId] = { remainingTime: duration, active: true, timer: 
        setInterval(async () => {
            timers[roomId].remainingTime--;

            if (timers[roomId].remainingTime === 0) {
                timers[roomId].active = false;
                clearInterval(timers[roomId].timer);

                const room = await prisma.roomTeam.findUnique({
                    where: {
                        id: roomId
                    },
                    include: {
                        quiz: {
                            include: {
                                questions: true
                            }
                        }
                    }
                });

                if (room) {
                    const questionCursor = room.questionCursor;

                    if (questionCursor < room.quiz.questions.length) {
                        await prisma.roomTeam.update({
                            where: {
                                id: room.id
                            },
                            data: {
                                questionCursor: { increment: 1 }
                            }
                        });

                        const nextQuestion = room.quiz.questions[questionCursor + 1];

                        await prisma.teamPlayer.updateMany({
                            where: {
                                team: {
                                    gameId: roomId
                                }
                            },
                            data: {
                                answered: false
                            }
                        });

                        // Envoyer un événement SSE pour informer tous les joueurs de la nouvelle question
                        teamUtils.sseClients[roomId].forEach(client => {
                            client.res.write(`data: ${JSON.stringify({ question: nextQuestion })}\n\n`);
                        });

                        // Démarrer le timer pour la nouvelle question
                        startTimer(roomId, room.timeLimit);
                    }
                }
            }
            teamUtils.sseClients[roomId].forEach(client => {
                client.res.write(`data: ${JSON.stringify({ timer:timers[roomId].remainingTime   })}\n\n`);
            });
        }, 1000)
    };
}

export async function interruptTimer(roomId: string): Promise<void> {
    timers[roomId].active = false;
    clearTimeout(timers[roomId].timer);
}

export function hasActiveTimer(roomId: string): boolean {
    return timers[roomId] !== undefined && timers[roomId].active;
}