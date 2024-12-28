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
                const players = updatedGame.roomPlayers.map(player => player.user.userName);

                sseClients[gameId].forEach(client => {
                    client.res.write(`data: ${JSON.stringify({ players })}\n\n`);
                });
                
                if (updatedGame.launched) {
                    // Supprimer l'intervalle
                    clearInterval(intervals[gameId]);
                    delete intervals[gameId];
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

export async function start(roomId: string) {
    const room = await prisma.room.findUnique({
        where: {
            id: roomId
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
            client.res.write(`data: ${JSON.stringify({ nextQuestion: true })}\n\n`);
        });
    }
}