import { prisma } from "../model/db";

export let sseClients: Record<string, any[]> = {};
let intervals: Record<string, NodeJS.Timeout> = {};

export function addClientToSSE(gameId: string, client: any): void {
    if (!sseClients[gameId]) {
        sseClients[gameId] = [];
    }
    sseClients[gameId].push(client);

    // Si l'intervalle n'existe pas encore, le créer
    if (!intervals[gameId]) {
        intervals[gameId] = setInterval(async () => {
            const updatedGame = await prisma.room.findUnique({
                where: {
                    id: gameId
                },
                include: {
                    roomPlayers: {
                        include: {
                            user: true
                        }
                    }
                }
            });

            if (updatedGame) {
                if (updatedGame.launched) {
                    console.log("Partie lancée");
                    // Si la partie est lancée, arrêter l'intervalle et supprimer les clients SSE
                    clearInterval(intervals[gameId]);
                    delete intervals[gameId];
                } else {
                    const players = updatedGame.roomPlayers.map(player => player.user.userName);
                    sseClients[gameId].forEach(client => {
                        client.res.write(`data: ${JSON.stringify({ players })}\n\n`);
                    });
                }
            }
        }, 1000);
    }
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
