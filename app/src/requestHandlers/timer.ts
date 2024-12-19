import { prisma } from "../model/db";
import { Request, Response } from "express";
import { assert, string } from "superstruct";
import * as userUtils from "../utils/userUtils";

import { timers } from "../utils/timerUtils";

class HttpError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

export async function listen(req: Request, res: Response) {
        try{
        const gameId = req.query.gameId as string;

        assert(gameId, string());

        const game = await prisma.game.findUnique({
            where: {
                id: gameId
            },
            include: {
                quiz: {
                    include: {
                        questions: true
                    }
                },
            }
        });

        if (!game) {
            throw new HttpError("Partie non trouvée !", 404);
        }

        if (game.userId !== null) {
            const user = await userUtils.getUser(req);

            if (user?.id !== game.userId) {
                throw new HttpError("Cette partie ne peut pas être jouée avec ce compte", 403);
            }
        }

        if(!timers[gameId]) {
            throw new HttpError("Aucun timer actif pour cette partie", 404);
        }

        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Connection', 'keep-alive');

        let interval = setInterval(() => {
            if (timers[gameId]){
                res.write(`data: ${JSON.stringify({ time: timers[gameId].remainingTime })}\n\n`);        
            } 
            else {
                res.write(`data: ${JSON.stringify({ time: 0 })}\n\n`);
                res.end();
                clearInterval(interval);
            }
        }, 1000);
    }
    catch (error: any) {
        if (error instanceof HttpError) {
            return res.status(error.status).json({ error: error.message });
        }
        else {
            return res.status(500).json({ error: error.message });
        }
    }
}