import { Request, Response } from "express";
import { create, currentQuestion, verifyCurrentQuestionAnswer, infos,average } from "../src/requestHandlers/game";
import { prisma } from "../src/model/db";
import * as gameUtils from "../src/utils/gameUtils";
import * as userUtils from "../src/utils/userUtils";

jest.mock("../src/model/db");
jest.mock("../src/utils/gameUtils");
jest.mock("../src/utils/userUtils");

jest.mock('../src/model/db', () => ({
    prisma: {
        quiz: {
            findUnique: jest.fn(),
        },
        game: {
            create: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        answer: {
            createMany: jest.fn(),
            update: jest.fn(),
        },
    },
}));

describe("Game Controller", () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let jsonMock: jest.Mock;

    beforeEach(() => {
        req = {
            params: { id: "1" },
        };
        jsonMock = jest.fn();
        res = {
            status: jest.fn(() => ({
                json: jsonMock,
            })),
        } as unknown as Response;
    });

    it("should create a new game", async () => {
        const mockQuiz = {
            id: 1,
            public: true,
            questions: [
                { id: 1, text: "Question 1", correctAnswer: "Answer 1", falseAnswer1: "Answer 2", falseAnswer2: "Answer 3", falseAnswer3: "Answer 4", trueFalse: false },
            ],
        };

        const mockUser = { id: 1 };

        (prisma.quiz.findUnique as jest.Mock).mockResolvedValue(mockQuiz);
        (userUtils.getUser as jest.Mock).mockResolvedValue(mockUser);
        (gameUtils.getUniqueId as jest.Mock).mockResolvedValue("unique-game-id");

        await create(req as Request, res as Response);

        expect(prisma.quiz.findUnique).toHaveBeenCalledWith({
            where: { id: 1 },
            include: { questions: true },
        });

        expect(prisma.game.create).toHaveBeenCalledWith({
            data: {
                id: "unique-game-id",
                questionCursor: 0,
                quiz: { connect: { id: 1 } },
                user: { connect: { id: 1 } },
            },
        });

        expect(prisma.answer.createMany).toHaveBeenCalledWith({
            data: [
                { questionId: 1, gameId: "unique-game-id", correct: false },
            ],
        });

        expect(res.status).toHaveBeenCalledWith(201);
        expect(jsonMock).toHaveBeenCalledWith({ id: "unique-game-id" });
    });
    
    it("should get the current question of a game", async () => {
        const mockGame = {
            id: "1",
            questionCursor: 0,
            quiz: {
                questions: [
                    { id: 1, text: "Question 1", correctAnswer: "Answer 1", falseAnswer1: "Answer 2", falseAnswer2: "Answer 3", falseAnswer3: "Answer 4", trueFalse: false },
                ],
            },
            userId: null,
        };
    
        (prisma.game.findUnique as jest.Mock).mockResolvedValue(mockGame);
    
        await currentQuestion(req as Request, res as Response);
    
        expect(prisma.game.findUnique).toHaveBeenCalledWith({
            where: { id: "1" },
            include: {
                quiz: {
                    include: { questions: true },
                },
            },
        });
    
        expect(res.status).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
            question: "Question 1",
            answers: expect.arrayContaining(["Answer 1", "Answer 2", "Answer 3", "Answer 4"]),
        });
    });

    it("should verify the current question answer", async () => {
        const mockGame = {
            id: "1",
            questionCursor: 0,
            quiz: {
                questions: [
                    { id: 1, text: "Question 1", correctAnswer: "Answer 1", falseAnswer1: "Answer 2", falseAnswer2: "Answer 3", falseAnswer3: "Answer 4", trueFalse: false },
                ],
            },
            userId: null,
            answers: [],
        };
    
        const mockUser = { id: 1 };
    
        (prisma.game.findUnique as jest.Mock).mockResolvedValue(mockGame);
        (userUtils.getUser as jest.Mock).mockResolvedValue(mockUser);
        (prisma.answer.update as jest.Mock).mockResolvedValue({});
        (prisma.game.update as jest.Mock).mockResolvedValue({});
    
        req = {
            params: { id: "1" },
            body: { answer: "Answer 1" },
        };
    
        await verifyCurrentQuestionAnswer(req as Request, res as Response);
    
        expect(prisma.game.findUnique).toHaveBeenCalledWith({
            where: { id: "1" },
            include: {
                quiz: {
                    include: { questions: true },
                },
            },
        });
    
        expect(prisma.answer.update).toHaveBeenCalledWith({
            where: {
                questionId_gameId: {
                    questionId: 1,
                    gameId: "1",
                },
            },
            data: {
                correct: true,
            },
        });
    
        expect(prisma.game.update).toHaveBeenCalledWith({
            where: { id: "1" },
            data: { questionCursor: 1 },
        });
    
        expect(res.status).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({ correctAnswer: "Answer 1" });
    });

    it("should get the game infos", async () => {
        const mockGame = {
            id: "1",
            questionCursor: 1,
            quiz: {
                questions: [
                    { id: 1, text: "Question 1", correctAnswer: "Answer 1", falseAnswer1: "Answer 2", falseAnswer2: "Answer 3", falseAnswer3: "Answer 4", trueFalse: false },
                    { id: 2, text: "Question 2", correctAnswer: "Answer 1", falseAnswer1: "Answer 2", falseAnswer2: "Answer 3", falseAnswer3: "Answer 4", trueFalse: false },
                ],
                difficulty: "medium",
                category: 1,
            },
            userId: null,
            answers: [
                { questionId: 1, gameId: "1", correct: true },
                { questionId: 2, gameId: "1", correct: false },
            ],
            createdAt: new Date(),
        };
    
        const mockUser = { id: 1 };
    
        (prisma.game.findUnique as jest.Mock).mockResolvedValue(mockGame);
        (userUtils.getUser as jest.Mock).mockResolvedValue(mockUser);
    
        await infos(req as Request, res as Response);
    
        expect(prisma.game.findUnique).toHaveBeenCalledWith({
            where: { id: "1" },
            include: {
                quiz: {
                    include: { questions: true },
                },
                answers: true,
            },
        });
    
        expect(res.status).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
            results: [true, false],
            questionCursor: 1,
            numberOfQuestions: 2,
            Difficulty: "medium",
            Category: 1,
            CreateDate: mockGame.createdAt,
        });
    });

    it("should get the average score of a user", async () => {
        const mockGames = [
            { id: "1", userId: 1, answers: [{ correct: true }, { correct: false }] },
            { id: "2", userId: 1, answers: [{ correct: true }, { correct: true }] },
        ];
    
        (prisma.game.findMany as jest.Mock).mockResolvedValue(mockGames);
    
        req = {
            params: { userId: "1" },
        };
    
        await average(req as Request, res as Response);
    
        expect(prisma.game.findMany).toHaveBeenCalledWith({
            where: { userId: 1 },
            include: { answers: true },
        });
    
        expect(res.status).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
            averageScore: 0.75, // (3 correct answers out of 4 total answers)
        });
    });
});