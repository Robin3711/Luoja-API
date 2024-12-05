import { create, retrieve, edit } from "../src/requestHandlers/quiz";
import { prisma } from "../src/model/db";
import * as gameUtils from "../src/utils/gameUtils";
import * as userUtils from "../src/utils/userUtils";
import { Request, Response } from "express";
import { publish,fastCreate } from "../src/requestHandlers/quiz";

jest.mock("../src/model/db");
jest.mock("../src/utils/gameUtils");
jest.mock("../src/utils/userUtils");

jest.mock('../src/model/db', () => ({
    prisma: {
        quiz: {
            create: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        question: {
            createMany: jest.fn(),
            deleteMany: jest.fn(),
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
            title: "Sample Quiz",
            category: 9,
            difficulty: "easy",
            public: true,
            userId: 1,
            questions: [
                { text: "Question 1", correctAnswer: "Answer 1", incorrectAnswers: [], type: undefined },
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
        expect(jsonMock).toHaveBeenCalledWith({
            quiz: {
                ...mockQuiz,
                id: undefined,
                userId: undefined,
                questions: mockQuiz.questions.map(q => ({
                    ...q,
                    incorrectAnswers: [],
                    type: undefined,
                })),
            },
        });
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

    it("should edit a quiz", async () => {
        const mockUser = { id: 1 };
        const mockQuiz = {
            id: 1,
            userId: 1,
            public: false,
            questions: [
                { id: 1, text: "Question 1", correctAnswer: "Answer 1", falseAnswer1: "Answer 2", falseAnswer2: "Answer 3", falseAnswer3: "Answer 4", trueFalse: false },
            ],
        };

        (userUtils.getUser as jest.Mock).mockResolvedValue(mockUser);
        (prisma.quiz.findUnique as jest.Mock).mockResolvedValue(mockQuiz);
        (prisma.quiz.update as jest.Mock).mockResolvedValue(mockQuiz);

        req = {
            params: { id: "1" },
            query: {
                title: "Updated Quiz",
                category: "10",
                difficulty: "medium",
            },
            body: {
                questions: [
                    {
                        text: "Updated Question 1",
                        correctAnswer: "Updated Answer 1",
                        incorrectAnswers: ["Updated Answer 2", "Updated Answer 3", "Updated Answer 4"],
                    },
                ],
            },
        };

        await edit(req as Request, res as Response);

        expect(prisma.quiz.findUnique).toHaveBeenCalledWith({
            where: { id: 1 },
            include: { questions: true },
        });

        expect(userUtils.getUser).toHaveBeenCalledWith(req);

        expect(prisma.quiz.update).toHaveBeenCalledWith({
            where: { id: 1 },
            data: {
                title: "Updated Quiz",
                category: 10,
                difficulty: "medium",
                updatedAt: expect.any(Date),
            },
        });

        expect(prisma.question.deleteMany).toHaveBeenCalledWith({
            where: { quizId: 1 },
        });

        expect(prisma.question.createMany).toHaveBeenCalledWith({
            data: [
                {
                    text: "Updated Question 1",
                    trueFalse: false,
                    correctAnswer: "Updated Answer 1",
                    falseAnswer1: "Updated Answer 2",
                    falseAnswer2: "Updated Answer 3",
                    falseAnswer3: "Updated Answer 4",
                    quizId: 1,
                },
            ],
        });

        expect(res.status).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({ quizId: 1 });
    });

    it("should return 404 if quiz to edit is not found", async () => {
        const mockUser = { id: 1 };

        (userUtils.getUser as jest.Mock).mockResolvedValue(mockUser);
        (prisma.quiz.findUnique as jest.Mock).mockResolvedValue(null);

        req = {
            params: { id: "1" },
            query: {
                title: "Updated Quiz",
                category: "10",
                difficulty: "medium",
            },
            body: {
                questions: [
                    {
                        text: "Updated Question 1",
                        correctAnswer: "Updated Answer 1",
                        incorrectAnswers: ["Updated Answer 2", "Updated Answer 3", "Updated Answer 4"],
                    },
                ],
            },
        };

        await edit(req as Request, res as Response);

        expect(prisma.quiz.findUnique).toHaveBeenCalledWith({
            where: { id: 1 },
            include: { questions: true },
        });

        expect(res.status).toHaveBeenCalledWith(404);
        expect(jsonMock).toHaveBeenCalledWith({ error: "Quiz non trouvé" });
    });

    it("should return 403 if quiz to edit is public", async () => {
        const mockUser = { id: 1 };
        const mockQuiz = {
            id: 1,
            userId: 1,
            public: true,
            questions: [
                { id: 1, text: "Question 1", correctAnswer: "Answer 1", falseAnswer1: "Answer 2", falseAnswer2: "Answer 3", falseAnswer3: "Answer 4", trueFalse: false },
            ],
        };

        (userUtils.getUser as jest.Mock).mockResolvedValue(mockUser);
        (prisma.quiz.findUnique as jest.Mock).mockResolvedValue(mockQuiz);

        req = {
            params: { id: "1" },
            query: {
                title: "Updated Quiz",
                category: "10",
                difficulty: "medium",
            },
            body: {
                questions: [
                    {
                        text: "Updated Question 1",
                        correctAnswer: "Updated Answer 1",
                        incorrectAnswers: ["Updated Answer 2", "Updated Answer 3", "Updated Answer 4"],
                    },
                ],
            },
        };

        await edit(req as Request, res as Response);

        expect(prisma.quiz.findUnique).toHaveBeenCalledWith({
            where: { id: 1 },
            include: { questions: true },
        });

        expect(res.status).toHaveBeenCalledWith(403);
        expect(jsonMock).toHaveBeenCalledWith({ error: "Vous ne pouvez pas modifier un quiz public" });
    });

    it("should return 401 if user is not found when editing a quiz", async () => {
        const mockQuiz = {
            id: 1,
            userId: 1,
            public: false,
            questions: [
                { id: 1, text: "Question 1", correctAnswer: "Answer 1", falseAnswer1: "Answer 2", falseAnswer2: "Answer 3", falseAnswer3: "Answer 4", trueFalse: false },
            ],
        };

        (userUtils.getUser as jest.Mock).mockResolvedValue(null);
        (prisma.quiz.findUnique as jest.Mock).mockResolvedValue(mockQuiz);

        req = {
            params: { id: "1" },
            query: {
                title: "Updated Quiz",
                category: "10",
                difficulty: "medium",
            },
            body: {
                questions: [
                    {
                        text: "Updated Question 1",
                        correctAnswer: "Updated Answer 1",
                        incorrectAnswers: ["Updated Answer 2", "Updated Answer 3", "Updated Answer 4"],
                    },
                ],
            },
        };

        await edit(req as Request, res as Response);

        expect(prisma.quiz.findUnique).toHaveBeenCalledWith({
            where: { id: 1 },
            include: { questions: true },
        });

        expect(userUtils.getUser).toHaveBeenCalledWith(req);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(jsonMock).toHaveBeenCalledWith({ error: "Utilisateur non trouvé" });
    });

    it("should return 403 if quiz to edit does not belong to user", async () => {
        const mockUser = { id: 1 };
        const mockQuiz = {
            id: 1,
            userId: 2,
            public: false,
            questions: [
                { id: 1, text: "Question 1", correctAnswer: "Answer 1", falseAnswer1: "Answer 2", falseAnswer2: "Answer 3", falseAnswer3: "Answer 4", trueFalse: false },
            ],
        };

        (userUtils.getUser as jest.Mock).mockResolvedValue(mockUser);
        (prisma.quiz.findUnique as jest.Mock).mockResolvedValue(mockQuiz);

        req = {
            params: { id: "1" },
            query: {
                title: "Updated Quiz",
                category: "10",
                difficulty: "medium",
            },
            body: {
                questions: [
                    {
                        text: "Updated Question 1",
                        correctAnswer: "Updated Answer 1",
                        incorrectAnswers: ["Updated Answer 2", "Updated Answer 3", "Updated Answer 4"],
                    },
                ],
            },
        };

        await edit(req as Request, res as Response);

        expect(prisma.quiz.findUnique).toHaveBeenCalledWith({
            where: { id: 1 },
            include: { questions: true },
        });

        expect(userUtils.getUser).toHaveBeenCalledWith(req);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(jsonMock).toHaveBeenCalledWith({ error: "Ce quiz ne vous appartient pas" });
    });
    it("should publish a quiz", async () => {
        const mockUser = { id: 1 };
        const mockQuiz = {
            id: 1,
            userId: 1,
            public: false,
            questions: [
                { id: 1, text: "Question 1", correctAnswer: "Answer 1", falseAnswer1: "Answer 2", falseAnswer2: "Answer 3", falseAnswer3: "Answer 4", trueFalse: false },
            ],
        };

        (userUtils.getUser as jest.Mock).mockResolvedValue(mockUser);
        (prisma.quiz.findUnique as jest.Mock).mockResolvedValue(mockQuiz);
        (prisma.quiz.update as jest.Mock).mockResolvedValue({ ...mockQuiz, public: true });

        req = {
            params: { id: "1" },
        };

        await publish(req as Request, res as Response);

        expect(prisma.quiz.findUnique).toHaveBeenCalledWith({
            where: { id: 1 },
            include: { questions: true },
        });

        expect(userUtils.getUser).toHaveBeenCalledWith(req);

        expect(prisma.quiz.update).toHaveBeenCalledWith({
            where: { id: 1 },
            data: { public: true },
        });

        expect(res.status).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({ quizId: 1 });
    });

    it("should return 404 if quiz is not found", async () => {
        (prisma.quiz.findUnique as jest.Mock).mockResolvedValue(null);

        req = {
            params: { id: "1" },
        };

        await publish(req as Request, res as Response);

        expect(prisma.quiz.findUnique).toHaveBeenCalledWith({
            where: { id: 1 },
            include: { questions: true },
        });

        expect(res.status).toHaveBeenCalledWith(404);
        expect(jsonMock).toHaveBeenCalledWith({ error: "Quiz non trouvé" });
    });

    it("should return 403 if quiz is already public", async () => {
        const mockQuiz = {
            id: 1,
            userId: 1,
            public: true,
            questions: [
                { id: 1, text: "Question 1", correctAnswer: "Answer 1", falseAnswer1: "Answer 2", falseAnswer2: "Answer 3", falseAnswer3: "Answer 4", trueFalse: false },
            ],
        };

        (prisma.quiz.findUnique as jest.Mock).mockResolvedValue(mockQuiz);

        req = {
            params: { id: "1" },
        };

        await publish(req as Request, res as Response);

        expect(prisma.quiz.findUnique).toHaveBeenCalledWith({
            where: { id: 1 },
            include: { questions: true },
        });

        expect(res.status).toHaveBeenCalledWith(403);
        expect(jsonMock).toHaveBeenCalledWith({ error: "Ce quiz est déjà public" });
    });

    it("should return 401 if user is not found", async () => {
        const mockQuiz = {
            id: 1,
            userId: 1,
            public: false,
            questions: [
                { id: 1, text: "Question 1", correctAnswer: "Answer 1", falseAnswer1: "Answer 2", falseAnswer2: "Answer 3", falseAnswer3: "Answer 4", trueFalse: false },
            ],
        };

        (prisma.quiz.findUnique as jest.Mock).mockResolvedValue(mockQuiz);
        (userUtils.getUser as jest.Mock).mockResolvedValue(null);

        req = {
            params: { id: "1" },
        };

        await publish(req as Request, res as Response);

        expect(prisma.quiz.findUnique).toHaveBeenCalledWith({
            where: { id: 1 },
            include: { questions: true },
        });

        expect(userUtils.getUser).toHaveBeenCalledWith(req);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(jsonMock).toHaveBeenCalledWith({ error: "Utilisateur non trouvé" });
    });

    it("should return 403 if quiz does not belong to user", async () => {
        const mockUser = { id: 1 };
        const mockQuiz = {
            id: 1,
            userId: 2,
            public: false,
            questions: [
                { id: 1, text: "Question 1", correctAnswer: "Answer 1", falseAnswer1: "Answer 2", falseAnswer2: "Answer 3", falseAnswer3: "Answer 4", trueFalse: false },
            ],
        };

        (userUtils.getUser as jest.Mock).mockResolvedValue(mockUser);
        (prisma.quiz.findUnique as jest.Mock).mockResolvedValue(mockQuiz);

        req = {
            params: { id: "1" },
        };

        await publish(req as Request, res as Response);

        expect(prisma.quiz.findUnique).toHaveBeenCalledWith({
            where: { id: 1 },
            include: { questions: true },
        });

        expect(userUtils.getUser).toHaveBeenCalledWith(req);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(jsonMock).toHaveBeenCalledWith({ error: "Ce quiz ne vous appartient pas" });
    });
   
});