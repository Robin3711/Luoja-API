import { prisma } from "../model/db";
import { Request, Response } from "express";
import { assert, integer, string } from "superstruct";
import * as gameUtils from "../utils/gameUtils";
import * as userUtils from "../utils/userUtils";
import { title } from "process";






export async function create(req: Request, res: Response) {
    try {

        const quizId = Number(req.params.id);
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
            throw new Error("Quiz non trouvé");
        }

        if (!quiz.public) {
            throw new Error("Quiz non publié");
        }

        const user = await userUtils.getUser(req);

        const gameId = await gameUtils.getUniqueId();

        const gameData: any = {
            id: gameId,
            questionCursor: 0,
            quiz: {
                connect: { id: quiz.id }
            }
        };

        if (user) {
            gameData.user = {
                connect: { id: user.id }
            };
        }

        await prisma.game.create({
            data: gameData
        });

        const answers = quiz.questions.map(question => ({
            questionId: question.id,
            gameId: gameId,
            correct: false
        }));

        await prisma.answer.createMany({
            data: answers
        });

        res.status(201).json({ id: gameId });
    }
    catch (error: any) {
        if (error.message === "Quiz non trouvé") {
            res.status(404).json({ error: error.message });
        }
        if (error.message === "Quiz non publié") {
            res.status(403).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: error.message });
        }
}
}

// Fonction pour obtenir la question courante de la partie
export async function currentQuestion(req: Request, res: Response) {
    try {
        const gameId = req.params.id;
        assert(gameId, string());
        const game = await prisma.game.findUnique({
            where: {
                id: gameId
            },
            include: {
                quiz: {
                    include: {
                        questions: true
                    }
                },
            }
        });

        if (!game) {
            throw new Error("Partie non trouvée !")
        }

        if (game.userId !== null) {
            const user = await userUtils.getUser(req);

            if (user?.id !== game.userId) {
                throw new Error("Cette partie ne peut pas être jouée avec ce compte")
            }
        }

        let questionCursor = game.questionCursor;

        if (questionCursor >= game.quiz.questions.length) {
            throw new Error("Aucune question restante dans ce quiz.")
        }

        const question = game.quiz.questions[questionCursor];

        let answers = [];

        if (question.trueFalse) {
            answers = [question.correctAnswer, question.falseAnswer1];
        }
        else {
            answers = [question.correctAnswer, question.falseAnswer1, question.falseAnswer2, question.falseAnswer3];
        }

        for (let i = answers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [answers[i], answers[j]] = [answers[j], answers[i]];
        }

        res.status(200).json({
            question: question.text,
            answers: answers
        });
    }
    catch (error: any) {
        if (error.message === "Partie non trouvée !") {
            res.status(404).json({ error: error.message });
        }
        if (error.message === "Cette partie ne peut pas être jouée avec ce compte") {
            res.status(403).json({ error: error.message });
        }
        if (error.message === "Aucune question restante dans ce quiz.") {
            res.status(500).json({ error: error.message });
        }
        else {
            res.status(404).json({ error: error.message });
        }
        }
}

// Fonction pour vérifier la réponse à une question
export async function verifyCurrentQuestionAnswer(req: Request, res: Response) {
    try {
        const gameId = req.params.id;
        const answer = req.body.answer;

        assert(gameId, string());
        assert(answer, string());

        const game = await prisma.game.findUnique({
            where: {
                id: gameId
            },
            include: {
                quiz: {
                    include: {
                        questions: true
                    }
                }
            }
        });

        if (!game) {
            throw new Error("Partie non trouvée");
        }

        if (game.userId !== null) {
            const user = await userUtils.getUser(req);

            if (user?.id !== game.userId) {
                throw new Error("Cette partie ne peut pas être jouée avec ce compte")
            }
        }

        const questionCursor = game.questionCursor;

        if (questionCursor !== game.quiz.questions.length) {

            const question = game.quiz.questions[questionCursor];
            const correctAnswer = question.correctAnswer;
            const wasCorrect = answer === correctAnswer;

            await prisma.answer.update({
                where: {
                    questionId_gameId: {
                        questionId: question.id,
                        gameId: game.id
                    }
                },

                data: {
                    correct: wasCorrect
                }
            });

            const nextQuestion = questionCursor + 1;

            await prisma.game.update({
                where: {
                    id: game.id
                },
                data: {
                    questionCursor: nextQuestion
                }
            });

            res.status(200).json({ correctAnswer: correctAnswer });
        }
        else {
            throw new Error("Aucune question restante dans ce quiz.");
        }
    }
    catch (error: any) {
        if (error.message === "Partie non trouvée") {
            res.status(404).json({ error: error.message });
        }
        if (error.message === "Cette partie ne peut pas être jouée avec ce compte") {
            res.status(403).json({ error: error.message });
        }
        if (error.message === "Aucune question restante dans ce quiz.") {
            res.status(500).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: error.message });
        }
        }
}

// Fonction pour obtenir les informations d'une partie
export async function infos(req: Request, res: Response) {
    try {
        const gameId = req.params.id;
        assert(gameId, string());
        const game = await prisma.game.findUnique({
            where: {
                id: gameId
            },
            include: {
                quiz: {
                    include: {
                        questions: true
                    }
                },
                answers: true
            }
        });

        if (!game) {
            throw new Error("Partie non trouvée");
        }

        if (game.userId !== null) {
            const user = await userUtils.getUser(req);

            if (user?.id !== game.userId) {
                throw new Error("Cette partie ne peut pas être jouée avec ce compte")
            }
        }

        const numberOfQuestions = game.quiz.questions.length;

        const questionCursor = game.questionCursor;

        let results: any = [];

        game.answers.sort((a, b) => a.questionId - b.questionId);

        game.answers.map((answer) => {
            results.push(answer.correct);
        });

        res.status(200).json({ results: results, questionCursor: questionCursor, numberOfQuestions: numberOfQuestions, Difficulty: game.quiz.difficulty, Category: game.quiz.category, CreateDate: game.createdAt , Title : game.quiz.title});
    }
    catch (error: any) {
        if (error.message === "Partie non trouvée") {
            res.status(404).json({ error: error.message });
        }
        if (error.message === "Cette partie ne peut pas être jouée avec ce compte") {
            res.status(403).json({ error: error.message });
        }
        if (error.message === "Aucune question restante dans ce quiz.") {
            res.status(500).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: error.message });
        }
        }
}
export async function restart(req: Request, res: Response) {
    try {
        const gameIde = req.params.id;
        assert(gameIde, string());
        const game = await prisma.game.findUnique({
            where: {
                id: gameIde
            },
            include: {
                quiz: {
                    include: {
                        questions: true
                    }
                }
            }
        })

        if (!game) {
            throw new Error("Partie non trouvée");
        }

        if (game.userId !== null) {
            const user = await userUtils.getUser(req);

            if (user?.id !== game.userId) {
                throw new Error("Cette partie ne peut pas être jouée avec ce compte")
            }
        }

        req.params.id = game.quiz.id.toString()

        create(req, res);
    }
    catch (error: any) {
if (error.message === "Partie non trouvée") {
            res.status(404).json({ error: error.message });
        }   
        if (error.message === "Cette partie ne peut pas être jouée avec ce compte") {
            res.status(403).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: error.message });
        }
}

}



export async function average(req: Request, res: Response) {
    try {
        const gameId = req.params.id;
        assert(gameId, string());

        const game = await prisma.game.findUnique({
            where: {
                id: gameId
            },
            include: {
                quiz: {
                    include: {
                        questions: true
                    }
                },
                answers: true // Inclure les réponses dans la requête
            }
        });

        if (!game) {
            throw new Error("Partie non trouvée");
        }

        // Calculer la moyenne des scores
        const totalQuestions = game.quiz.questions.length;
        const correctAnswers = game.answers.filter(answer => answer.correct).length;
        const averageScore = (correctAnswers / totalQuestions) * 100;

        res.status(200).json({
            averageScore: averageScore
        });
    } catch (error: any) {
        if (error.message === "Partie non trouvée") {
            res.status(404).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: error.message });
        }
    }
}