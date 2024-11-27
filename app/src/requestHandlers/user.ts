import { prisma } from "../model/db";
import { Request, Response } from "express";
import { assert, object, string, refine } from "superstruct";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import * as userUtils from '../utils/userUtils';

const Name = refine(string(), 'name', value => {
    if (value.length < 3) {
        throw new Error('Nom invalide');
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

        if (await prisma.user.findUnique({ where: { userName: name } })) {
            throw new Error("Ce nom est déjà utilisé");
        }

        const user = await prisma.user.create({
            data: {
                userName: name,
                password: await bcrypt.hash(password, 10)
            }
        });

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!);

        res.json({ token });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

export async function login(req: Request, res: Response) {
    try {
        assert(req.body, LoginSchema);

        const { name, password } = req.body;

        const user = await prisma.user.findUnique({
            where: {
                userName: name
            }
        });

        if (!user) {
            throw new Error("Utilisateur non trouvé");
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            throw new Error("Mot de passe incorrect");
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!);

        res.json({ token });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
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

        res.json({ user });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function createdQuizs(req: Request, res: Response) {
    try {
        const user = await userUtils.getUser(req);

        if (!user) {
            throw new Error("Utilisateur non trouvé");
        }

        const quizs = await prisma.quiz.findMany({
            where: {
                userId: user.id
            }
        });

        res.json({ quizs });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function games(req: Request, res: Response) {
    try {
        const user = await userUtils.getUser(req);

        if (!user) {
            throw new Error("Utilisateur non trouvé");
        }

        const games = await prisma.game.findMany({
            where: {
                userId: user.id
            }
        });

        res.json({ games });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}
