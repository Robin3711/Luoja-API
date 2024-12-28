import { prisma } from "../model/db";
import { Request, Response } from "express";
import { assert, integer, string } from "superstruct";

import * as userUtils from "../utils/userUtils";
import * as gameUtils from "../utils/gameUtils";
import * as roomUtils from "../utils/roomUtils";

class HttpError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

export async function verifyAnswer(req: Request, res: Response) {
    try {
        const roomId = req.params.id;
        const answer = req.body.answer;
        const user = await userUtils.getUser(req);

        assert(roomId, string());
        assert(answer, string());

        if (!user) {
            throw new HttpError("Utilisateur non trouvé", 401);
        }

        const room = await prisma.room.findUnique({
            where: {
                id: roomId
            },
            include: {
                quiz: {
                    include: {
                        questions: true
                    }
                },
                roomPlayers: true
            }
        });

        if (!room) {
            throw new HttpError("Partie non trouvée", 404);
        }

        if (!room.launched) {
            throw new HttpError("La partie n'est pas encore lancée", 403);
        }

        const roomPlayer = await prisma.roomPlayer.findUnique({
            where: {
                userId_roomId: {
                    userId: user.id,
                    roomId: room.id
                }
            }
        });

        if (!roomPlayer) {
            throw new HttpError("Joueur non trouvé dans cette partie", 404);
        }

        if (roomPlayer.answered) {
            throw new HttpError("Vous avez déjà répondu à cette question", 403);
        }

        const questionCursor = room.questionCursor;

        if (questionCursor >= room.quiz.questions.length) {
            throw new HttpError("Aucune question restante dans ce quiz.", 500);
        }

        const question = room.quiz.questions[questionCursor];
        const correctAnswer = question.correctAnswer;
        const wasCorrect = answer === correctAnswer;

        await prisma.roomPlayer.update({
            where: {
                id: roomPlayer.id
            },
            data: {
                answered: true,
                score: wasCorrect ? roomPlayer.score + 1 : roomPlayer.score
            }
        });

        // Vérifier si tous les joueurs ont répondu
        const allPlayersAnswered = room.roomPlayers.every(player => player.answered);

        if (wasCorrect || allPlayersAnswered) {
            // Send SSE event for correct answer
            if (roomUtils.sseClients[roomId]) {
                roomUtils.sseClients[roomId].forEach(client => {
                    client.res.write(`data: ${JSON.stringify({ user: user.userName, correctAnswer: correctAnswer })}\n\n`);
                });
            }

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

                const nextQuestion = room.quiz.questions[questionCursor + 1];

                await prisma.roomPlayer.updateMany({
                    where: {
                        roomId: room.id
                    },
                    data: {
                        answered: false
                    }
                });

                // Send SSE event for next question
                if (roomUtils.sseClients[roomId]) {
                    roomUtils.sseClients[roomId].forEach(client => {
                        client.res.write(`data: ${JSON.stringify({ question: nextQuestion })}\n\n`);
                    });
                }
            }, 3000);
        } else {
            // Send SSE event for player answer
            if (roomUtils.sseClients[roomId]) {
                roomUtils.sseClients[roomId].forEach(client => {
                    client.res.write(`data: ${JSON.stringify({ user: user.userName, answer: answer })}\n\n`);
                });
            }
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

export async function join(req: Request, res: Response) {
    try {
        const roomId = req.params.id;
        const user = await userUtils.getUser(req);

        if (!user) {
            throw new HttpError("Utilisateur non trouvé", 401);
        }

        const room = await prisma.room.findUnique({
            where: {
                id: roomId
            },
            include: {
                roomPlayers: true
            }
        });

        if (!room) {
            throw new HttpError("Partie non trouvée", 404);
        }

        if (room.launched) {
            if (!(room.roomPlayers.find(player => player.userId === user.id))) {
                throw new HttpError("La partie est déjà lancée", 403);
            }
        }

        // Vérifier si le joueur est déjà dans la partie
        const existingPlayer = await prisma.roomPlayer.findUnique({
            where: {
                userId_roomId: {
                    userId: user.id,
                    roomId: room.id
                }
            }
        });

        if (!existingPlayer) {
            await prisma.roomPlayer.create({
                data: {
                    user: {
                        connect: { id: user.id }
                    },
                    room: {
                        connect: { id: room.id }
                    }
                }
            });
        }

        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Connection', 'keep-alive');

        // Ajouter le client SSE
        roomUtils.addClientToSSE(roomId, { res });

        // Envoyer un message initial pour garder la connexion ouverte
        res.write(`data: ${JSON.stringify({ message: "Connexion établie" })}\n\n`);

        if ( room.playerCount === room.roomPlayers.length + 1 ) {
            roomUtils.start(roomId);
        }
    } catch (error: any) {
        if (error instanceof HttpError) {
            return res.status(error.status).json({ error: error.message });
        } else {
            return res.status(500).json({ error: error.message });
        }
    }
}

export async function create(req: Request, res: Response) {
    try {
        const quizId = Number(req.params.id);
        const playerCount = Number(req.query.playerCount);
        const user = await userUtils.getUser(req);

        if (!user) {
            throw new HttpError("Utilisateur non trouvé", 401);
        }

        assert(quizId, integer());

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

        const room = await prisma.room.create({
            data: {
                id: roomId,
                quiz: {
                    connect: { id: quiz.id }
                },
                creator: {
                    connect: { id: user.id }
                },
                playerCount: playerCount,
                questionCursor: 0
            }
        });

        return res.status(201).json({ id: room.id });
    } catch (error: any) {
        if (error instanceof HttpError) {
            return res.status(error.status).json({ error: error.message });
        } else {
            return res.status(500).json({ error: error.message });
        }
    }
}