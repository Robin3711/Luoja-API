import { prisma } from "../model/db";
import { Request, Response } from "express";
import { fetchQuestions } from "../model/opentdb";
import { getUniqueId, resetProgress } from "../utils/quizUtils";
import { assert, object, string,refine, enums, optional } from "superstruct";

const CreateQuizQuerySchema = object({
    amount: refine(string(), 'amount', value => {
        if (isNaN(parseInt(value))) {
            throw new Error('Amount must be a number');
        }
        if (parseInt(value) < 1 || parseInt(value) > 50) {
            throw new Error('Amount must be between 1 and 50');
        }
        return true;
    }
    ),
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

export async function createQuiz(req: Request, res: Response) {

    try{
        assert(req.query, CreateQuizQuerySchema);

        const amount = req.query.amount as string;
        const category = req.query.category as string | undefined;
        const difficulty = req.query.difficulty as string | undefined;

        const questionData = await fetchQuestions(amount, category, difficulty);    
        
        const quizId = await getUniqueId();

        await prisma.quiz.create({
            data: {
                id: quizId,
            }
        });

        for (let question of questionData.results) {

            let trueFalse = true;

            if (question.incorrect_answers.length == 3) {
                trueFalse = false; 
            }

            await prisma.question.create({
                data: {
                    question: question.question,
                    trueFalse: trueFalse,
                    correctAnswer: question.correct_answer,
                    falseAnswer1: question.incorrect_answers[0],
                    falseAnswer2: question.incorrect_answers[1],
                    falseAnswer3: question.incorrect_answers[2],
                    quiz: {
                        connect: { id: quizId }
                    }
                }
            });
        }

        return res.status(200).json({quizId: quizId});
    }
    catch (error: any) {
        res.status(400).json({error: error.message});
    }
}

export async function getCurrentQuestion(req: Request, res: Response) {
    try{
        const quizId = req.params.id;

        assert(quizId, string());

        const quiz = await prisma.quiz.findUnique({
            where: {
                id: quizId
            },
            include: {
                questions: true
            }
        });

        if (!quiz) {
            res.status(404).json({erreur: "Quiz non trouvé"});
            return;
        }

        let questionCursor = quiz.questionCursor;

        const question = quiz.questions[questionCursor];

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
            question: question.question,
            answers: answers
        });
    }
    catch (error: any) {
        res.status(400).json({error: error.message});
    }
}

export async function verifyAnswer(req: Request, res: Response) {

    try{
        const quizId = req.params.id;
        const answer = req.body.answer;

        assert(quizId, string());
        assert(answer, string());

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

        let questionCursor = quiz.questionCursor;

        const question = quiz.questions[questionCursor];

        const correctAnswer = question.correctAnswer;

        const wasCorrect = answer === correctAnswer;
        
        await prisma.question.update({
            where: {
                id: question.id
            },
            data: {
                wasCorrect: wasCorrect
            }
        });

        let nextQuestion = questionCursor + 1;

        if (questionCursor === quiz.questions.length - 1) {
            await resetProgress(quizId)
        }
        else {
            await prisma.quiz.update({
                where: {
                    id: quizId
                },
                data: {
                    questionCursor: nextQuestion
                }
            });
        }

        res.status(200).json({correct: wasCorrect});
    }
    catch (error: any) {
        res.status(400).json({error: error.message});
    }
}

export async function getInfos(req: Request, res: Response) {
    try{
        const quizId = req.params.id;

        assert(quizId, string());

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

        const numberOfQuestions = quiz.questions.length;

        const questionCursor = quiz.questionCursor;

        const results = quiz.questions.map(question => question.wasCorrect);

        res.status(200).json({results: results, questionCursor: questionCursor, numberOfQuestions: numberOfQuestions});
    }
    catch (error: any) {
        res.status(400).json({error: error.message});
    }    
}