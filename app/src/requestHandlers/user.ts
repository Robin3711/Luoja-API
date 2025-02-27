import { prisma } from "../model/db";
import e, { Request, Response } from "express";
import { assert, object, string, refine } from "superstruct";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import * as userUtils from '../utils/userUtils';

class HttpError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

const Name = refine(string(), 'name', value => {
    if (value.length < 3) {
        throw new HttpError('Nom invalide', 400);
    }
    return true;
});

const CreateUserSchema = object({
    name: Name,
    password: string()
});

const LoginSchema = object({
    name: Name,
    password: string()
});

export async function create(req: Request, res: Response) {
    try {
        assert(req.body, CreateUserSchema);

        const { name, password } = req.body;

        if (password.length < 8) {
            throw new HttpError("Le mot de passe doit contenir au moins 8 caractères", 400);
        }

        if (await prisma.user.findUnique({ where: { userName: name } })) {
            throw new HttpError("Ce nom est déjà utilisé", 400);
        }

        const user = await prisma.user.create({ 
            data: {
                userName: name,
                password: await bcrypt.hash(password, 10)
            }
        });

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!);

        return res.status(201).json({ token });
    }
    catch (error: any) 
    {
        if (error instanceof HttpError) {
            return res.status(error.status).json({ error: error.message });
        }
        else {
            return res.status(400).json({ error: error.message });
        }
    }
}

export async function login(req: Request, res: Response) {
    try {
        assert(req.body, LoginSchema);

        const { name, password } = req.body;


        if (password.length < 8) {
            throw new HttpError("Le mot de passe doit contenir au moins 8 caractères", 400);
        }

        const user = await prisma.user.findUnique({
            where: {
                userName: name
            }
        });

        if (!user) {
            throw new HttpError("Utilisateur non trouvé", 401);
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            throw new HttpError("Mot de passe incorrect", 401);
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!);

        return res.json({ token });
    }
    catch (error: any) {
        if (error instanceof HttpError) {
            return res.status(error.status).json({ error: error.message });
        }
        else {
            return res.status(400).json({ error: error.message });
        }
    }
}

export async function infos(req: Request, res: Response) {
    try {
        const token = req.headers.token;

        if (!token) {
            return res.status(401).json({ error: "Token manquant" });
        }

        const decoded = jwt.verify(String(token), process.env.JWT_SECRET!) as { userId: number };

        if (!decoded || !decoded.userId) {
            return res.status(401).json({ error: "Token invalide" });
        }

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                userName: true
            }
        });

        if (!user) {
            return res.status(404).json({ error: "Utilisateur non trouvé" });
        }

        return res.json({ user });
    }
    catch (error: any) {
        return res.status(400).json({ error: error.message });
    }
}

export async function createdQuizs(req: Request, res: Response) {
    try {
        const user = await userUtils.getUser(req);

        if (!user) {
            throw new HttpError("Utilisateur non trouvé", 401);
        }

        // Récupérer les quizs créés par l'utilisateur + le nombre de questions et pas les questions
        
        const quizzes = await prisma.quiz.findMany({
            where: {
                userId: user.id
            },
            select: {
                id: true,
                title: true,
                category: true,
                difficulty: true,
                public: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: {
                        questions: true
                    }
                }
            }
        });
        const result = quizzes.map(quiz => ({
            id: quiz.id,
            title: quiz.title,
            category: quiz.category,
            difficulty: quiz.difficulty,
            public: quiz.public,
            createdAt: quiz.createdAt,
            updatedAt: quiz.updatedAt,
            numberOfQuestions: quiz._count.questions
        }));

        return res.status(200).json(result);
    } 
    catch (error: any) {
        if (error instanceof HttpError) {
            return res.status(error.status).json({ error: error.message });
        }
        else {
            return res.status(400).json({ error: error.message });
        }
    }
}

export async function games(req: Request, res: Response) {
    try {
        const user = await userUtils.getUser(req);

        if (!user) {
            throw new HttpError("Utilisateur non trouvé", 401);
        }

        const games = await prisma.game.findMany({
            where: {
                userId: user.id
            }
        });

        return res.json({ games });
    } 
    catch (error: any) {
        return res.status(400).json({ error: error.message });
    }
}