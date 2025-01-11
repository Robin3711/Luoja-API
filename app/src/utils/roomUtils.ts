import { prisma } from "../model/db";
import * as timerUtils from "./timerUtils";

export let sseClients: Record<string, any[]> = {};
let intervals: Record<string, NodeJS.Timeout> = {};

export function addClientToSSE(gameId: string, client: any): void {
    if (!sseClients[gameId]) {
        sseClients[gameId] = [];
    }
    sseClients[gameId].push(client);
}

export function removeClientFromSSE(gameId: string, client: any): void {
    if (sseClients[gameId]) {
        sseClients[gameId] = sseClients[gameId].filter(c => c !== client);

        // Si aucun client n'est connecté, arrêter l'intervalle
        if (sseClients[gameId].length === 0) {
            clearInterval(intervals[gameId]);
            delete intervals[gameId];
        }
    }
}

export async function start(roomId: string) {
    const room = await prisma.room.findUnique({
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

    if (!room) {
        throw new Error("Partie non trouvée");
    }

    // Attendre 5 secondes avant de lancer la partie
    await new Promise(resolve => setTimeout(resolve, 5000));

    await prisma.room.update({
        where: {
            id: room.id
        },
        data: {
            launched: true
        }
    });

    // Envoyer un événement SSE pour informer tous les joueurs de la première question
    if (sseClients[roomId]) {
        sseClients[roomId].forEach(client => {
            client.res.write(`data: ${JSON.stringify({ eventType: "gameStart" })}\n\n`);
        });

        // Envoyer les informations du quiz
        sseClients[roomId].forEach(client => {
            client.res.write(`data: ${JSON.stringify({ eventType: "quizInfos", totalQuestion: room.quiz.questions.length })}\n\n`);
        });
    }
}

export async function nextQuestion(roomId: string) {

    const room = await prisma.room.findUnique({
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

    if (!room) {
        throw new Error("Partie non trouvée");
    }

    //Check if there are question left
    if (room.quiz.questions.length === room.questionCursor + 1) {

        // Send SSE event for game end after 3 seconds
        setTimeout(async () => {
            if (sseClients[roomId]) {
                sseClients[roomId].forEach(client => {
                    client.res.write(`data: ${JSON.stringify({ eventType: "gameEnd" })}\n\n`);
                });
            }
        }, 3000);
    }
    else {
        // Wait 3 seconds before moving to next question
        setTimeout(async () => {
            await prisma.room.update({
                where: {
                    id: room.id
                },
                data: {
                    questionCursor: { increment: 1 }
                }
            });

            await prisma.roomPlayer.updateMany({
                where: {
                    roomId: room.id
                },
                data: {
                    answered: false
                }
            });

            // Send SSE event for next question
            if (sseClients[roomId]) {
                sseClients[roomId].forEach(client => {
                    client.res.write(`data: ${JSON.stringify({ eventType: "nextQuestion" })}\n\n`);
                });

                if (room.gameMode === "team"){
                    timerUtils.startRoomTimer(roomId, 10);
                }
            }
        }, 3000);
    }
}