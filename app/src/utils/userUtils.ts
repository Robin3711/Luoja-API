import jwt from "jsonwebtoken";
import { Request } from "express";
import { prisma } from "../model/db";

// Fonction qui permet de récupérer l'id de l'utilisateur à partir de la requête
async function getUserId(req: Request): Promise<number | null> {
    const token = req.headers.token;
        
    if (!token) {
        return null;
    }

    // Vérifier si le token est valide
    const decoded = jwt.verify(String(token), process.env.JWT_SECRET!) as { userId: number };

    if (!decoded || !decoded.userId) {
        return null
    }

    return decoded.userId;
}

// Fonction qui permet de récupérer l'utilisateur connecté à partir de la requête
export async function getUser(req: Request): Promise<{ id: number, email: string } | null> {

    const userId = await getUserId(req);

    if (!userId) {
        return null;
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            password: false
        }
    });

    return user;
}