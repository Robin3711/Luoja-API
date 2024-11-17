import { User } from "@prisma/client";
import { Request } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../model/db";


//Recupère  l'id l'utilisateur connecté
export async function    getUserId(req: Request): number | undefined {
    const token = req.headers.token;
        
    if (!token) {
        return undefined;
    }

    // Vérifier si le token est valide
    const decoded = jwt.verify(String(token), process.env.JWT_SECRET!) as { userId: number };

    if (!decoded || !decoded.userId) {
        return undefined
    }

    return decoded.userId;

}

//Récupère l'utilisateur connecté a partir de l'id
export async function getUserById(userId: number): Promise<User | null> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            password: true
        }
    });

    return user;
}