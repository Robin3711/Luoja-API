import { Request, Response } from "express";
import { create, getCurrentQuestion, verifyAnswer, getInfos } from "../src/requestHandlers/quiz";
import { resetProgress } from "../src/utils/quizUtils";
import { prisma } from "../src/model/db";
import { fetchQuestions } from "../src/model/opentdb";
import { humanId } from "human-id";

jest.mock("../src/model/db");
jest.mock("../src/model/opentdb");
jest.mock("human-id");

jest.mock('../src/model/db', () => ({
    prisma: {
        quiz: {
            create: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        question: {
            create: jest.fn(),
            update: jest.fn(),
            updateMany: jest.fn(),
        },
    },
}));

describe("Contrôleur de Quiz", () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;

    beforeEach(() => {
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock });
        req = { query: {}, params: {}, body: {} };
        res = { status: statusMock };
        jest.clearAllMocks();
    });

    describe("createQuiz", () => {
        it("devrait créer un quiz et retourner quizId", async () => {
            req.query = { amount: "10", category: "9", difficulty: "hard" };
            (fetchQuestions as jest.Mock).mockResolvedValue({ results: [{ question: "Q1", correct_answer: "A1", incorrect_answers: ["A2", "A3", "A4"] }] });
            (humanId as jest.Mock).mockReturnValue("quiz-id");
            (prisma.quiz.create as jest.Mock).mockResolvedValue({});
            (prisma.question.create as jest.Mock).mockResolvedValue({});

            await create(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({ quizId: "quiz-id" });
        });

        it("devrait retourner 400 si la validation échoue", async () => {
            req.query = { amount: "invalid" };

            await create(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ error: expect.any(String) });
        });
    });

    describe("getCurrentQuestion", () => {
        it("devrait retourner la question actuelle et les réponses mélangées", async () => {
            req.params = { id: "quiz-id" };
            (prisma.quiz.findUnique as jest.Mock).mockResolvedValue({
                questionCursor: 0,
                questions: [{ question: "Q1", trueFalse: false, correctAnswer: "A1", falseAnswer1: "A2", falseAnswer2: "A3", falseAnswer3: "A4" }]
            });

            await getCurrentQuestion(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(200);
            const response = jsonMock.mock.calls[0][0];
            expect(response.answers).toContain("A1");
            expect(response.answers.length).toBe(4);
        });

        it("devrait retourner 404 si le quiz n'est pas trouvé", async () => {
            req.params = { id: "quiz-id" };
            (prisma.quiz.findUnique as jest.Mock).mockResolvedValue(null);

            await getCurrentQuestion(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith({ erreur: "Quiz non trouvé" });
        });
    });

    describe("verifyCurrentQuestionAnswer", () => {
        it("devrait vérifier la réponse et mettre à jour la question", async () => {
            req.params = { id: "quiz-id" };
            req.body = { answer: "A1" };
            (prisma.quiz.findUnique as jest.Mock).mockResolvedValue({
                questionCursor: 0,
                questions: [{ id: "question-id", correctAnswer: "A1" }]
            });
            (prisma.question.update as jest.Mock).mockResolvedValue({});
            (prisma.quiz.update as jest.Mock).mockResolvedValue({});

            await verifyAnswer(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({ correct: true });
        });

        it("devrait retourner 400 si le quiz n'est pas trouvé", async () => {
            req.params = { id: "quiz-id" };
            req.body = { answer: "A1" };
            (prisma.quiz.findUnique as jest.Mock).mockResolvedValue(null);

            await verifyAnswer(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ error: "Quiz non trouvé" });
        });
    });

    describe("getQuizInfos", () => {
        it("devrait retourner les informations du quiz", async () => {
            req.params = { id: "quiz-id" };
            (prisma.quiz.findUnique as jest.Mock).mockResolvedValue({
                questionCursor: 1,
                questions: [{ wasCorrect: true }, { wasCorrect: false }]
            });

            await getInfos(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({
                results: [true, false],
                questionCursor: 1,
                numberOfQuestions: 2
            });
        });

        it("devrait retourner 400 si le quiz n'est pas trouvé", async () => {
            req.params = { id: "quiz-id" };
            (prisma.quiz.findUnique as jest.Mock).mockResolvedValue(null);

            await getInfos(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ error: "Quiz non trouvé" });
        });
    });

    describe("resetQuiz", () => {
        it("devrait réinitialiser le quiz", async () => {
            (prisma.quiz.findUnique as jest.Mock).mockResolvedValue({
                id: "quiz-id",
                questions: [{ id: "question-id" }]
            });
            (prisma.question.updateMany as jest.Mock).mockResolvedValue({});
            (prisma.quiz.update as jest.Mock).mockResolvedValue({});

            await resetProgress("quiz-id");

            expect(prisma.question.updateMany).toHaveBeenCalledWith({
                where: { quizId: "quiz-id" },
                data: { wasCorrect: false }
            });
            expect(prisma.quiz.update).toHaveBeenCalledWith({
                where: { id: "quiz-id" },
                data: { questionCursor: 0 }
            });
        });
    });
});
