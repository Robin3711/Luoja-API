import { prisma } from "../model/db";
import { Request, Response } from "express";
import { assert, integer, string } from "superstruct";
import * as userUtils from "../utils/userUtils";
import { addClientToSSE, removeClientFromSSE, sseClients } from "../utils/gameMultyUtils";
import * as gameUtils from "../utils/gameUtils";

class HttpError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

export async function verifyMultiplayerAnswer(req: Request, res: Response) {
    try {
        const gameId = req.params.id;
        const answer = req.body.answer;
        const user = await userUtils.getUser(req);

        assert(gameId, string());
        assert(answer, string());

        if (!user) {
            throw new HttpError("Utilisateur non trouvé", 401);
        }

        const game = await prisma.multiplayerGame.findUnique({
            where: {
                id: gameId
            },
            include: {
                quiz: {
                    include: {
                        questions: true
                    }
                },
                players: true
            }
        });

        if (!game) {
            throw new HttpError("Partie non trouvée", 404);
        }

        if (!game.launched) {
            throw new HttpError("La partie n'est pas encore lancée", 403);
        }

        const player = await prisma.multiplayerPlayer.findUnique({
            where: {
                userId_gameId: {
                    userId: user.id,
                    gameId: game.id
                }
            }
        });

        if (!player) {
            throw new HttpError("Joueur non trouvé dans cette partie", 404);
        }

        if (player.answered) {
            throw new HttpError("Vous avez déjà répondu à cette question", 403);
        }

        const questionCursor = game.questionCursor;

        if (questionCursor >= game.quiz.questions.length) {
            throw new HttpError("Aucune question restante dans ce quiz.", 500);
        }

        const question = game.quiz.questions[questionCursor];
        const correctAnswer = question.correctAnswer;
        const wasCorrect = answer === correctAnswer;

        await prisma.multiplayerPlayer.update({
            where: {
                id: player.id
            },
            data: {
                answered: true,
                score: wasCorrect ? player.score + 1 : player.score
            }
        });

        // Vérifier si tous les joueurs ont répondu
        const allPlayersAnswered = game.players.every(player => player.answered);

        if (wasCorrect || allPlayersAnswered) {
            // Envoyer un événement SSE pour informer tous les joueurs de la bonne réponse
            sseClients[gameId].forEach(client => {
                client.res.write(`data: ${JSON.stringify({ user: user.userName, correctAnswer: correctAnswer })}\n\n`);
            });

            // Attendre 3 secondes avant de passer à la question suivante
            setTimeout(async () => {
                await prisma.multiplayerGame.update({
                    where: {
                        id: game.id
                    },
                    data: {
                        questionCursor: { increment: 1 }
                    }
                });

                const nextQuestion = game.quiz.questions[questionCursor + 1];

                await prisma.multiplayerPlayer.updateMany({
                    where: {
                        gameId: game.id
                    },
                    data: {
                        answered: false
                    }
                });

                // Envoyer un événement SSE pour informer tous les joueurs de la nouvelle question
                sseClients[gameId].forEach(client => {
                    client.res.write(`data: ${JSON.stringify({ question: nextQuestion })}\n\n`);
                });
            }, 3000);
        } else {
            // Envoyer un événement SSE pour informer tous les joueurs de la réponse du joueur
            sseClients[gameId].forEach(client => {
                client.res.write(`data: ${JSON.stringify({ user: user.userName, answer: answer })}\n\n`);
            });
        }

        return res.status(200).json({ correctAnswer: correctAnswer });
    }
    catch (error: any) {
        if (error instanceof HttpError) {
            return res.status(error.status).json({ error: error.message });
        }
        else {
            return res.status(500).json({ error: error.message });
        }
    }
}

export async function joinMultiplayerGame(req: Request, res: Response) {
    try {
        const gameId = req.params.id;
        const user = await userUtils.getUser(req);

        if (!user) {
            throw new HttpError("Utilisateur non trouvé", 401);
        }

        const game = await prisma.multiplayerGame.findUnique({
            where: {
                id: gameId
            },
            include: {
                players: true
            }
        });

        if (!game) {
            throw new HttpError("Partie non trouvée", 404);
        }

        if (game.launched) {
            if (!(game.players.find(player => player.userId === user.id))) {
                throw new HttpError("La partie est déjà lancée", 403);
            }
        }

        // Vérifier si le joueur est déjà dans la partie
        const existingPlayer = await prisma.multiplayerPlayer.findUnique({
            where: {
                userId_gameId: {
                    userId: user.id,
                    gameId: game.id
                }
            }
        });

        if (!existingPlayer) {
            await prisma.multiplayerPlayer.create({
                data: {
                    user: {
                        connect: { id: user.id }
                    },
                    game: {
                        connect: { id: game.id }
                    }
                }
            });
        }

        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Connection', 'keep-alive');

        // Ajouter le client SSE
        addClientToSSE(gameId, { res });

    
        // Envoyer un message initial pour garder la connexion ouverte
        res.write(`data: ${JSON.stringify({ message: "Connexion établie" })}\n\n`);
    }
    catch (error: any) {
        if (error instanceof HttpError) {
            return res.status(error.status).json({ error: error.message });
        }
        else {
            return res.status(500).json({ error: error.message });
        }
    }
}

export async function createMultiplayerGame(req: Request, res: Response) {
    try {
        const quizId = Number(req.params.id);
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

        const gameId = await gameUtils.getUniqueId();

        const game = await prisma.multiplayerGame.create({
            data: {
                id: gameId,
                quiz: {
                    connect: { id: quiz.id }
                },
                creator: {
                    connect: { id: user.id }
                },
                questionCursor: 0
            }
        });

        return res.status(201).json({ id: game.id });
    }
    catch (error: any) {
        if (error instanceof HttpError) {
            return res.status(error.status).json({ error: error.message });
        }
        else {
            return res.status(500).json({ error: error.message });
        }
    }
}


export async function startMultiplayerGame(req: Request, res: Response) {
    try {
        const gameId = req.params.id;
        const user = await userUtils.getUser(req);

        if (!user) {
            throw new HttpError("Utilisateur non trouvé", 401);
        }

        const game = await prisma.multiplayerGame.findUnique({
            where: {
                id: gameId
            }
        });

        if (!game) {
            throw new HttpError("Partie non trouvée", 404);
        }

        if (game.creatorId !== user.id) {
            throw new HttpError("Seul le créateur de la partie peut la démarrer", 403);
        }

        if (game.launched) {
            throw new HttpError("La partie est déjà lancée", 403);
        }

        await prisma.multiplayerGame.update({
            where: {
                id: game.id
            },
            data: {
                launched: true
            }
        });

       
         res.status(200).json({ message: "Partie démarrée avec succès" });

            // Envoyer un événement SSE pour informer tous les joueurs de la première question
            sseClients[gameId].forEach(client => {
                client.res.write(`data: ${JSON.stringify({ nextQuestion: true })}\n\n`);
            });
    

    }
    catch (error: any) {
        if (error instanceof HttpError) {
            return res.status(error.status).json({ error: error.message });
        }
        else {
            return res.status(500).json({ error: error.message });
        }
    }
}