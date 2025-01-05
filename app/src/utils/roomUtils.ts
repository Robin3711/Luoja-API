import { prisma } from "../model/db";

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