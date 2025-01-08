import { prisma } from "../model/db";


export let sseClients: Record<string, any[]> = {};
let intervals: Record<string, NodeJS.Timeout> = {};

export function addClientToSSE(roomId: string, client: any): void {
    if (!sseClients[roomId]) {
        sseClients[roomId] = [];
    }
    sseClients[roomId].push(client);

   
}

export function removeClientFromSSE(roomId: string, client: any): void {
    if (sseClients[roomId]) {
        sseClients[roomId] = sseClients[roomId].filter(c => c !== client);

        // Si aucun client n'est connecté, arrêter l'intervalle
        if (sseClients[roomId]. length === 0) {
            clearInterval(intervals[roomId]);
            delete intervals[roomId];
        }
    }
}


export function endGame(roomId: string): void {
    if (intervals[roomId]) {
        clearInterval(intervals[roomId]);
        delete intervals[roomId];
    }
}
