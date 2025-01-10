import { prisma } from "../model/db";


export let sseClients: Record<string, any[]> = {};
let intervals: Record<string, NodeJS.Timeout> = {};

export function addClientToSSE(roomId: string, client: any): void {
    if (!sseClients[roomId]) {
        sseClients[roomId] = [];
    }
    sseClients[roomId].push(client);

    // Si l'intervalle n'existe pas encore, le créer
    if (!intervals[roomId]) {
        intervals[roomId] = setInterval(async () => {
            const updatedRoom = await prisma.roomTeam.findUnique({
                where: {
                    id: roomId
                },
                include: {
                    teams: {
                        include: {
                            players: {
                                include: {
                                    user: true
                                }
                            }
                        }
                    }
                }
            });

            if (updatedRoom) {
                const teams = updatedRoom.teams.map(team => ({
                    name: team.name,
                    id: team.id,
                    players: team.players.map(player => player.user.userName)
                }));

                
            }
        }, 1000);
    }
}

export function removeClientFromSSE(roomId: string, client: any): void {
    if (sseClients[roomId]) {
        sseClients[roomId] = sseClients[roomId].filter(c => c !== client);

        // Si aucun client n'est connecté, arrêter l'intervalle
        if (sseClients[roomId].length === 0) {
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