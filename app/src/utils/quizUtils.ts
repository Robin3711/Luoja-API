import { prisma } from "../model/db";
import { humanId } from "human-id";

export async function getUniqueId() {

    const allowedAttempts = 10;

    for(let i = 0; i < allowedAttempts; i++) {
        const id = humanId({
            separator: '-',
            capitalize: false
        });

        let quiz = await prisma.quizGame.findUnique({
            where: {
                id: id
            }
        });

        if (!quiz) {
            return id;
        }
    }

    throw new Error("Impossible de générer un identifiant unique pour le quiz");
}

export async function resetProgress(quizId: string) {

    await prisma.quizGame.update({
        where: {
            id: quizId
        },
        data: {
            questionCursor: 0
        }
    });

    await prisma.quizGameResponse.updateMany({
        where: {
            quizGame: {
                id: quizId
            }
        },
        data: {
            response: false
        }
    });
}