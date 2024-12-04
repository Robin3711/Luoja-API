import { create, retrieve } from "../src/requestHandlers/quiz";
import { prisma } from "../src/model/db";
import * as gameUtils from "../src/utils/gameUtils";
import * as userUtils from "../src/utils/userUtils";
import { Request, Response } from "express";

jest.mock("../src/model/db");
jest.mock("../src/utils/gameUtils");
jest.mock("../src/utils/userUtils");

jest.mock('../src/model/db', () => ({
    prisma: {
        quiz: {
            create: jest.fn(),
            findUnique: jest.fn(),
        },
        question: {
            createMany: jest.fn(),
        },
    },
}));

describe("Quiz Controller", () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let jsonMock: jest.Mock;

    beforeEach(() => {
        req = {
            query: {
                title: "Sample Quiz",
                category: "9",
                difficulty: "easy",
                public: "true",
            },
            body: {
                questions: [
                    {
                        text: "Question 1",
                        correctAnswer: "Answer 1",
                        incorrectAnswers: ["Answer 2", "Answer 3", "Answer 4"],
                    },
                ],
            },
        };
        jsonMock = jest.fn();
        res = {
            status: jest.fn(() => ({
                json: jsonMock,
            })),
        } as unknown as Response;
    });

    it("should create a new quiz", async () => {
        const mockUser = { id: 1 };
        const mockQuiz = { id: 1 };

        (userUtils.getUser as jest.Mock).mockResolvedValue(mockUser);
        (prisma.quiz.create as jest.Mock).mockResolvedValue(mockQuiz);

        await create(req as Request, res as Response);

        expect(userUtils.getUser).toHaveBeenCalledWith(req);

        expect(prisma.quiz.create).toHaveBeenCalledWith({
            data: {
                title: "Sample Quiz",
                category: 9,
                difficulty: "easy",
                public: true,
                user: { connect: { id: 1 } },
            },
        });

        expect(prisma.question.createMany).toHaveBeenCalledWith({
            data: [
                {
                    text: "Question 1",
                    trueFalse: false,
                    correctAnswer: "Answer 1",
                    falseAnswer1: "Answer 2",
                    falseAnswer2: "Answer 3",
                    falseAnswer3: "Answer 4",
                    quizId: 1,
                },
            ],
        });

        expect(res.status).toHaveBeenCalledWith(201);
        expect(jsonMock).toHaveBeenCalledWith({ quizId: 1 });
    });

    it("should retrieve a quiz", async () => {
        const mockUser = { id: 1 };
        const mockQuiz = {
            id: 1,
            userId: 1,
            questions: [
                { id: 1, text: "Question 1", correctAnswer: "Answer 1", falseAnswer1: "Answer 2", falseAnswer2: "Answer 3", falseAnswer3: "Answer 4", trueFalse: false },
            ],
        };

        (userUtils.getUser as jest.Mock).mockResolvedValue(mockUser);
        (prisma.quiz.findUnique as jest.Mock).mockResolvedValue(mockQuiz);

        req = {
            params: { id: "1" },
        };

        await retrieve(req as Request, res as Response);

        expect(userUtils.getUser).toHaveBeenCalledWith(req);

        expect(prisma.quiz.findUnique).toHaveBeenCalledWith({
            where: { id: 1 },
            include: { questions: true },
        });

        expect(res.status).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({ quiz: mockQuiz });
    });

    it("should return 401 if user is not found", async () => {
        (userUtils.getUser as jest.Mock).mockResolvedValue(null);

        req = {
            params: { id: "1" },
        };

        await retrieve(req as Request, res as Response);

        expect(userUtils.getUser).toHaveBeenCalledWith(req);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(jsonMock).toHaveBeenCalledWith({ error: "Utilisateur non trouvé" });
    });

    it("should return 404 if quiz is not found", async () => {
        const mockUser = { id: 1 };

        (userUtils.getUser as jest.Mock).mockResolvedValue(mockUser);
        (prisma.quiz.findUnique as jest.Mock).mockResolvedValue(null);

        req = {
            params: { id: "1" },
        };

        await retrieve(req as Request, res as Response);

        expect(userUtils.getUser).toHaveBeenCalledWith(req);

        expect(prisma.quiz.findUnique).toHaveBeenCalledWith({
            where: { id: 1 },
            include: { questions: true },
        });

        expect(res.status).toHaveBeenCalledWith(404);
        expect(jsonMock).toHaveBeenCalledWith({ error: "Quiz non trouvé" });
    });

    it("should return 403 if quiz does not belong to user", async () => {
        const mockUser = { id: 1 };
        const mockQuiz = {
            id: 1,
            userId: 2,
            questions: [
                { id: 1, text: "Question 1", correctAnswer: "Answer 1", falseAnswer1: "Answer 2", falseAnswer2: "Answer 3", falseAnswer3: "Answer 4", trueFalse: false },
            ],
        };

        (userUtils.getUser as jest.Mock).mockResolvedValue(mockUser);
        (prisma.quiz.findUnique as jest.Mock).mockResolvedValue(mockQuiz);

        req = {
            params: { id: "1" },
        };

        await retrieve(req as Request, res as Response);

        expect(userUtils.getUser).toHaveBeenCalledWith(req);

        expect(prisma.quiz.findUnique).toHaveBeenCalledWith({
            where: { id: 1 },
            include: { questions: true },
        });

        expect(res.status).toHaveBeenCalledWith(403);
        expect(jsonMock).toHaveBeenCalledWith({ error: "Ce quiz ne vous appartient pas" });
    });
});