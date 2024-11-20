import { prisma } from "../model/db";
import { Request, Response } from "express";
import { assert, object, string, refine, enums, optional, array } from "superstruct";

import * as openTDB from "../model/opentdb";
import * as userUtils from "../utils/userUtils";

// Schéma pour la requête de récupération de questions
const OpenTDBQuerySchema = object({
    amount: refine(string(), 'amount', value => {
        if (isNaN(parseInt(value))) {
            throw new Error('Amount must be a number');
        }
        if (parseInt(value) < 1 || parseInt(value) > 50) {
            throw new Error('Amount must be between 1 and 50');
        }
        return true;
    }),
    category: optional(refine(string(), 'category', value => {
        if (isNaN(parseInt(value))) {
            throw new Error('Category must be a number');
        }
        if (parseInt(value) < 9 || parseInt(value) > 32) {
            throw new Error('Category must be between 9 and 32');
        }
        return true;
    })),
    difficulty: optional(enums(['easy', 'medium', 'hard']))
});

// Schéma pour une question
const QuestionSchema = object({
    text: string(),
    correctAnswer: string(),
    incorrectAnswers: array(string())
});

// Schéma pour la création d'un quiz
const CreateQuizQuerySchema = object({
    category: optional(refine(string(), 'category', value => {
        if (isNaN(parseInt(value))) {
            throw new Error('Category must be a number');
        }
        if (parseInt(value) < 9 || parseInt(value) > 32) {
            throw new Error('Category must be between 9 and 32');
        }
        return true;
    })),
    difficulty: optional(enums(['easy', 'medium', 'hard'])),
    title: string(),
    public: optional(string()),
});

// Schéma pour le corps de la requête de création d'un quiz
const CreateQuizBodySchema = object({
    questions: array(QuestionSchema) 
});

const ListQuizQuerySchema = object({
    title: optional(string()),
    category: optional(refine(string(), 'category', value => {
        if (isNaN(parseInt(value))) {
            throw new Error('Category must be a number');
        }
        if (parseInt(value) < 9 || parseInt(value) > 32) {
            throw new Error('Category must be between 9 and 32');
        }
        return true;
    })),
    difficulty: optional(enums(['easy', 'medium', 'hard']))
});

// Fonction pour obtenir des questions de OpenTDB
export async function getOpentTDBQuestions(req: Request, res: Response) {
    try{
        assert(req.query, OpenTDBQuerySchema);

        const amount = req.query.amount as string;
        const category = req.query.category as string | undefined;
        const difficulty = req.query.difficulty as string | undefined;

        const data = await openTDB.fetchQuestions(amount, category, difficulty);         
       
        return res.status(200).json(data);
    }
    catch (error: any) {
        res.status(500).json({error: error.message});
    }
}

export async function create(req: Request, res: Response) {
    try{
        assert(req.query, CreateQuizQuerySchema);
        assert(req.body, CreateQuizBodySchema);
        
        const publicQuiz = req.query.public === "true";

        let quizData: any= {
            title: req.query.title as string,
            category: Number(req.query.category),
            difficulty: req.query.difficulty as string,
            public:  publicQuiz
        }

        const user = await userUtils.getUser(req);

        if (user) {
            quizData.user = {
                connect: { id: user.id }
            }
        }

        const quiz = await prisma.quiz.create({
            data: quizData
        });
    
        for (let question of req.body.questions) {
            let trueFalse = question.incorrectAnswers.length === 1;

            await prisma.question.create({
                data: {
                    text: question.text,
                    trueFalse: trueFalse,
                    correctAnswer: question.correctAnswer,
                    falseAnswer1: question.incorrectAnswers[0] || null,
                    falseAnswer2: question.incorrectAnswers[1] || null,
                    falseAnswer3: question.incorrectAnswers[2] || null,
                    quiz: {
                        connect: { id: quiz.id }
                    }
                }
            });
        }

        res.status(200).json({quizId: quiz.id});
    }
    catch (error: any) {
        res.status(500).json({error: error.message});
    }
}

// Fonction pour obtenir un quiz à partir de son id et le cloner
export async function clone(req: Request, res: Response) {
    try{
        const quizId = req.params.id;

        assert(quizId, string());

        const quiz = await prisma.quiz.findUnique({
            where: {
                id: Number(quizId),
                public: true
            },
            include: {
                questions: true
            }
        });

        if (!quiz) {
            throw new Error("Quiz non trouvé");
        }

        let questions = quiz.questions.map((question) => {
            return {
                question: question.text,
                correctAnswer: question.correctAnswer,
                incorrectAnswers: [question.falseAnswer1, question.falseAnswer2, question.falseAnswer3].filter(Boolean)
            }
        });

        res.status(200).json({questions: questions});
    }
    catch (error: any) {
        res.status(500).json({error: error.message});
    }
}

// Fonction pour obtenir une liste de quiz
export async function list(req: Request, res: Response) {
    try {

        assert(req.query, ListQuizQuerySchema);

        let where: any = {
            public: true
        };

        const title = req.query.title as string;

        if (title) {
            where.title = {
                contains: title
            }
        }

        const category = req.query.category as string;

        if (category) {
            where.category = Number(category);
        }

        const difficulty = req.query.difficulty as string;

        if (difficulty) {
            where.difficulty = difficulty;
        }

        const quizs = await prisma.quiz.findMany({
            where
        });

        res.status(200).json({quizs: quizs});
    }
    catch (error: any) {
        res.status(500).json({error: error.message});
    }
}