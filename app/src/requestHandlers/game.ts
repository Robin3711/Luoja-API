import { prisma } from "../model/db";
import { assert, string } from "superstruct";
import { Request, Response } from "express";

import * as gameUtils from "../utils/gameUtils";
import * as userUtils from "../utils/userUtils";

export async function create(req: Request, res: Response) {
    try {
        const quizId = req.params.id;

        assert(quizId, string());

        const quiz = await prisma.quiz.findUnique({
            where: {
                id: Number(quizId)
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

        const gameId = await gameUtils.getUniqueId();

        const gameData: any = {
            id: gameId,
            questionCursor: 0,
            quiz: {
                connect: { id: quiz.id }
            }
        };

        const user = await userUtils.getUser(req);

        if (user) {
            gameData.user = {
                connect: { id: user.id }
            };
        }

        await prisma.game.create({
            data: gameData
        });

        for (let question of quiz.questions) {
            await prisma.answer.create({
                data: {
                    question: {
                        connect: { id: question.id }
                    },
                    game: {
                        connect: { id: gameId }
                    },
                    correct: false
                }
            });
        }

        res.status(200).json({id: gameId});
    }
    catch (error: any) {
        res.status(500).json({error: error.message});
    }
}

// Fonction pour obtenir la question courante de la partie
export async function getCurrentQuestion(req: Request, res: Response) {
    try{
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

        if(!game){
            throw new Error("Partie non trouvée !")
        }

        if(game.userId !== null){
            const requestUser = await userUtils.getUser(req);

            if(requestUser?.id !== game.userId){
                throw new Error("Cette partie ne peut pas être jouée avec ce compte")
            }
        }

        let questionCursor = game.questionCursor;

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
        res.status(500).json({error: error.message});
    }
}

// Fonction pour vérifier la réponse à une question
export async function verifyCurrentQuestionAnswer(req: Request, res: Response) {
    try{
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

        if(game.userId !== null){
            const requestUser = await userUtils.getUser(req);

            if(requestUser?.id !== game.userId){
                throw new Error("Cette partie ne peut pas être jouée avec ce compte")
            }
        }

        let questionCursor = game.questionCursor;

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

        let nextQuestion = questionCursor + 1;

        if (questionCursor === game.quiz.questions.length - 1) {
            await gameUtils.resetProgress(game.id)
        }
        else {
            await prisma.game.update({
                where: {
                    id:  game.id
                },
                data: {
                    questionCursor: nextQuestion
                }
            });
        }

        res.status(200).json({correctAnswer: correctAnswer});
    }
    catch (error: any) {
        res.status(500).json({error: error.message});
    }
}

// Fonction pour obtenir les informations d'une partie
export async function getInfos(req: Request, res: Response) {
    try{
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
                }
            }
        });

        if (!game) {
            throw new Error("Partie non trouvée");
        }

        if(game.userId !== null){
            const requestUser = await userUtils.getUser(req);

            if(requestUser?.id !== game.userId){
                throw new Error("Cette partie ne peut pas être jouée avec ce compte")
            }
        }

        const numberOfQuestions = game.quiz.questions.length;

        const questionCursor = game.questionCursor;

        let results = [];

        let questionsIds = game.quiz.questions.map((question) => question.id);

        for (let questionId of questionsIds) {
            let answer = await prisma.answer.findUnique({
                where: {
                    questionId_gameId: {
                        questionId: questionId,
                        gameId: game.id
                    }
                }
            });

            if (!answer) {
                throw new Error("Réponse non trouvée");
            }

            results.push(answer.correct);
        }
      
        res.status(200).json({results: results, questionCursor: questionCursor, numberOfQuestions: numberOfQuestions});
    }
    catch (error: any) {
        res.status(500).json({error: error.message});
    }    
}
