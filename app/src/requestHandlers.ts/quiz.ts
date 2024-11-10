import { Request, Response } from "express";
import { fetchQuestions } from "../model/opentdb";
import { assert, object, string,refine, enums } from "superstruct";
import { prisma } from "../model/db";
import { humanId } from "human-id";

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
    category: refine(string(), 'category', value => {
        if (isNaN(parseInt(value))) {
            throw new Error('Category must be a number');
        }
        if (parseInt(value) < 9 || parseInt(value) > 32) {
            throw new Error('Category must be between 9 and 32');
        }

        return true;
    }),
    difficulty: enums(['easy', 'medium', 'hard'])
});

export async function createQuiz(req: Request, res: Response) {

    try{
        assert(req.query, CreateQuizQuerySchema);

        const amount = req.query.amount as string;
        const category = req.query.category as string;
        const difficulty = req.query.difficulty as string;
        
        const questionData = await fetchQuestions(amount, category, difficulty);

        const quizId = humanId({separator: '-', capitalize: false});

        await prisma.quiz.create({
            data: {
                id: quizId,
            }
        });

        for (let question of questionData.results) {

            if (question.incorrect_answers.length == 3) {

                await prisma.question.create({
                    data: {
                        question: question.question,
                        trueOrFalse: false,
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
            else {
                await prisma.question.create({
                    data: {
                        question: question.question,
                        trueOrFalse: true,
                        correctAnswer: question.correct_answer,
                        falseAnswer1: question.incorrect_answers[0],
                        quiz: {
                            connect: { id: quizId }
                        }
                    }
                });
            }
        }

        return res.status(200).json({quizId: quizId});
    }
    catch (error: any) {
        res.status(400).json({error: error.message});
    }
}

export async function getCurrentQuestion(req: Request, res: Response) {
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

    let currentQuestion = quiz.currentQuestion;

    if (currentQuestion === quiz.questions.length) {
        currentQuestion = 0;
    }

    const question = quiz.questions[currentQuestion];

    let answers = [];

    if (question.trueOrFalse) {
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

export async function getCurrentQuestionAnswer(req: Request, res: Response) {
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

    let currentQuestion = quiz.currentQuestion;

    const question = quiz.questions[currentQuestion];

    const correctAnswer = question.correctAnswer;

    let nextQuestion = currentQuestion + 1;

    if (currentQuestion === quiz.questions.length - 1) {
        nextQuestion = 0;
    }

    await prisma.quiz.update({
        where: {
            id: quizId
        },
        data: {
            currentQuestion: nextQuestion
        }
    });

    res.status(200).json({
        correctAnswer: correctAnswer
    });
}