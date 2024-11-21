import { prisma } from "../model/db";
import { Request, Response } from "express";
import { assert, object, string, refine } from "superstruct";
import validator from 'validator';

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import * as userUtils from '../utils/userUtils';

const Email = refine(string(), 'email', value => {
    if (!validator.isEmail(value)) {
        throw new Error('Email invalide');
    }
    return true;
});
  
const CreateUserSchema = object({
    email: Email,
    password: string()
});

const LoginSchema = object({
    email: Email,
    password: string()
});

export async function create(req: Request, res: Response) {
    try {
        assert(req.body, CreateUserSchema);

        const { email, password } = req.body;

        if (await prisma.user.findUnique({ where: { email } })) {
            throw new Error("Cet email est déjà utilisé");
        }

        const user = await prisma.user.create({
            data: {
                email,
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

        const { email, password } = req.body;

        const user = await prisma.user.findUnique({
            where: {
                email
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
        // Récupérer le token depuis les en-têtes de la requête
        const token = req.headers.token;
        
        if (!token) {
            return res.status(401).json({ error: "Token manquant" });
        }

        // Vérifier et décoder le token
        const decoded = jwt.verify(String(token), process.env.JWT_SECRET!) as { userId: number };

        if (!decoded || !decoded.userId) {
            return res.status(401).json({ error: "Token invalide" });
        }

        // Rechercher l'utilisateur dans la base de données
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true
            }
        });

        if (!user) {
            return res.status(404).json({ error: "Utilisateur non trouvé" });
        }
        
        // Retourner les informations de l'utilisateur
        res.json({ user });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function createdQuizs(req: Request, res: Response) {
    try
    {
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
    }
    catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function games( req: Request, res: Response) {
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
    }
    catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}
