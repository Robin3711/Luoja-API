import { prisma } from "../model/db";
import { Request, Response } from "express";
import { assert, integer, string, array, object } from "superstruct";

import * as userUtils from "../utils/userUtils";
import * as gameUtils from "../utils/gameUtils";
import * as teamUtils from "../utils/teamUtils";
import * as timerUtils from "../utils/timerUtils";

class HttpError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

const CreateTeamRoomSchema = object({
    quizId: integer(),
    teams: array(object({
        name: string()
    })),
    timeLimit: integer() 
});

export async function createTeamRoom(req: Request, res: Response) {
    try {
        assert(req.body, CreateTeamRoomSchema);

        const { quizId, teams, timeLimit } = req.body;
        const user = await userUtils.getUser(req);

        if (!user) {
            throw new HttpError("Utilisateur non trouvé", 401);
        }

        const quiz = await prisma.quiz.findUnique({
            where: {
                id: quizId
            },
            include: {
                questions: true
            }
        });

        if (!quiz) {
            throw new HttpError("Quiz non trouvé", 404);
        }

        if (!quiz.public) {
            throw new HttpError("Quiz non publié", 403);
        }

        const roomId = await gameUtils.getUniqueId();

        const room = await prisma.roomTeam.create({
            data: {
                id: roomId,
                quiz: {
                    connect: { id: quiz.id }
                },
                creator: {
                    connect: { id: user.id }
                },
                questionCursor: 0,
                playerCount: 0,
                timeLimit: timeLimit 
            }
        });

        for (const team of teams) {
            await prisma.team.create({
                data: {
                   
                    name: team.name,
                    roomTeam: {
                        connect: { id: room.id }
                    }
                }
            });
        }

        return res.status(201).json({ id: room.id });
    } catch (error: any) {
        if (error instanceof HttpError) {
            return res.status(error.status).json({ error: error.message });
        } else {
            return res.status(500).json({ error: error.message });
        }
    }
}

export async function listenTeams(req: Request, res: Response) {
    try {
        const roomId = req.params.id;
        const user = await userUtils.getUser(req);

        if (!user) {
            throw new HttpError("Utilisateur non trouvé", 401);
        }

        const room = await prisma.roomTeam.findUnique({
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

        if (!room) {
            throw new HttpError("Partie non trouvée", 404);
        }

        const teams = room.teams.map(team => ({
            name: team.name,
            id: team.id,
            players: team.players.map(player => player.user.userName)
        }));

        return res.status(200).json({ teams });
    } catch (error: any) {
        if (error instanceof HttpError) {
            return res.status(error.status).json({ error: error.message });
        } else {
            return res.status(500).json({ error: error.message });
        }
    }
}


export async function joinTeam(req: Request, res: Response) {
    try {
        const { roomId } = req.params;
        const teamId = parseInt(req.params.teamId, 10);
        const user = await userUtils.getUser(req);

        if (!user) {
            throw new HttpError("Utilisateur non trouvé", 401);
        }

        const room = await prisma.roomTeam.findUnique({
            where: {
                id: roomId
            },
            include: {
                teams: true
            }
        });

        if (!room) {
            throw new HttpError("Partie non trouvée", 404);
        }

        if (room.launched) {
            throw new HttpError("La partie est déjà lancée", 403);
        }

        // Supprimer l'utilisateur des autres équipes
        await prisma.teamPlayer.deleteMany({
            where: {
                userId: user.id,
                team: {
                    gameId: roomId
                }
            }
        });

        // Vérifier si l'utilisateur est déjà membre de l'équipe
        const existingTeamPlayer = await prisma.teamPlayer.findUnique({
            where: {
                userId_teamId: {
                    userId: user.id,
                    teamId: teamId
                }
            }
        });

        if (!existingTeamPlayer) {
            // Ajouter l'utilisateur à la nouvelle équipe
            await prisma.teamPlayer.create({
                data: {
                    user: {
                        connect: { id: user.id }
                    },
                    team: {
                        connect: { id: teamId }
                    }
                }
            });
        }

        
        // Configurer la connexion SSE
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Connection', 'keep-alive');

        // Ajouter le client SSE
        teamUtils.addClientToSSE(roomId, { res });

        // Envoyer un message initial pour garder la connexion ouverte
        res.write(`data: ${JSON.stringify({ message: "Connexion établie" })}\n\n`);

        req.on('close', () => {
            teamUtils.removeClientFromSSE(roomId, { res });
        });
    } catch (error: any) {
        if (error instanceof HttpError) {
            return res.status(error.status).json({ error: error.message });
        } else {
            return res.status(500).json({ error: error.message });
        }
    }
}

export async function startTeamRoom(req: Request, res: Response) {
    try {
        const roomId = req.params.id;
        const user = await userUtils.getUser(req);

        if (!user) {
            throw new HttpError("Utilisateur non trouvé", 401);
        }

        const room = await prisma.roomTeam.findUnique({
            where: {
                id: roomId
            },
            include: {
                quiz: {
                    include: {
                        questions: true
                    }
                },
                teams: {
                    include: {
                        players: true
                    }
                }
            }
        });

        if (!room) {
            throw new HttpError("Partie non trouvée", 404);
        }

        if (room.creatorId !== user.id) {
            throw new HttpError("Seul le créateur de la partie peut la démarrer", 403);
        }

        if (room.launched) {
            throw new HttpError("La partie est déjà lancée", 403);
        }

        // Mettre à jour l'état de la salle pour indiquer qu'elle est lancée
        await prisma.roomTeam.update({
            where: {
                id: room.id
            },
            data: {
                launched: true
            }
        });

        const firstQuestion = room.quiz.questions[0];
        // Attendre 5 secondes avant de lancer la partie
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Envoyer un événement SSE pour informer tous les joueurs de la première question
        teamUtils.sseClients[roomId].forEach(client => {
            client.res.write(`data: ${JSON.stringify({ question: firstQuestion })}\n\n`);
        });

        // Démarrer le timer pour la première question
        timerUtils.startTimer(roomId, room.timeLimit);

        return res.status(200).json({ message: "Partie démarrée avec succès" });
    } catch (error: any) {
        if (error instanceof HttpError) {
            return res.status(error.status).json({ error: error.message });
        } else {
            return res.status(500).json({ error: error.message });
        }
    }
}

export async function verifyTeamAnswer(req: Request, res: Response) {
    try {
        const roomId = req.params.id;
        const answer = req.body.answer;
        const user = await userUtils.getUser(req);

        assert(roomId, string());
        assert(answer, string());

        if (!user) {
            throw new HttpError("Utilisateur non trouvé", 401);
        }

        const room = await prisma.roomTeam.findUnique({
            where: {
                id: roomId
            },
            include: {
                quiz: {
                    include: {
                        questions: true
                    }
                },
                teams: {
                    include: {
                        players: true
                    }
                }
            }
        });

        if (!room) {
            throw new HttpError("Partie non trouvée", 404);
        }

        if (!room.launched) {
            throw new HttpError("La partie n'est pas encore lancée", 403);
        }

        const teamPlayer = await prisma.teamPlayer.findUnique({
            where: {
                userId_teamId: {
                    userId: user.id,
                    teamId: req.body.teamId
                }
            }
        });

        if (!teamPlayer) {
            throw new HttpError("Joueur non trouvé dans cette équipe", 404);
        }

        if (teamPlayer.answered) {
            throw new HttpError("Vous avez déjà répondu à cette question", 403);
        }

        const questionCursor = room.questionCursor;

        if (questionCursor >= room.quiz.questions.length) {
            throw new HttpError("Aucune question restante dans ce quiz.", 500);
        }

        const question = room.quiz.questions[questionCursor];
        const correctAnswer = question.correctAnswer;
        const wasCorrect = answer === correctAnswer;

        await prisma.teamPlayer.update({
            where: {
                id: teamPlayer.id
            },
            data: {
                answered: true,
                score: wasCorrect ? teamPlayer.score + 1 : teamPlayer.score
            }
        });

        // Vérifier si tous les joueurs ont répondu
        const allPlayersAnswered = room.teams.every(team => team.players.every(player => player.answered));

        if (wasCorrect || allPlayersAnswered) {
            // Envoyer un événement SSE pour informer tous les joueurs de la bonne réponse
            teamUtils.sseClients[roomId].forEach(client => {
                client.res.write(`data: ${JSON.stringify({ user: user.userName, correctAnswer: correctAnswer })}\n\n`);
            });

            // Attendre 3 secondes avant de passer à la question suivante
            setTimeout(async () => {
                const nextQuestionCursor = questionCursor + 1;

                if (nextQuestionCursor >= room.quiz.questions.length) {
                    // Calculer les scores finaux et envoyer les résultats
                    const teams = await prisma.team.findMany({
                        where: {
                            gameId: roomId
                        },
                        include: {
                            players: true
                        }
                    });

                    const results = teams.map(team => {
                        const totalScore = team.players.reduce((acc, player) => acc + player.score, 0);
                        const averageScore = totalScore / team.players.length;
                        return {
                            teamName: team.name,
                            averageScore: averageScore
                        };
                    });

                    // Envoyer les résultats finaux aux clients SSE
                    teamUtils.sseClients[roomId].forEach(client => {
                        client.res.write(`data: ${JSON.stringify({ event: "gameEnd", results })}\n\n`);
                        client.res.end();
                    });

                    // Arrêter le timer
                    timerUtils.interruptTimer(roomId);
                    teamUtils.endGame(roomId);
                } else {
                    await prisma.roomTeam.update({
                        where: {
                            id: room.id
                        },
                        data: {
                            questionCursor: nextQuestionCursor
                        }
                    });

                    const nextQuestion = room.quiz.questions[nextQuestionCursor];

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
                    timerUtils.startTimer(roomId, room.timeLimit);
                }
            }, 3000);
        } else {
            // Envoyer un événement SSE pour informer tous les joueurs de la réponse du joueur
            teamUtils.sseClients[roomId].forEach(client => {
                client.res.write(`data: ${JSON.stringify({ user: user.userName, answer: answer })}\n\n`);
            });
        }

        return res.status(200).json({ correctAnswer: correctAnswer });
    } catch (error: any) {
        if (error instanceof HttpError) {
            return res.status(error.status).json({ error: error.message });
        } else {
            return res.status(500).json({ error: error.message });
        }
    }
}



