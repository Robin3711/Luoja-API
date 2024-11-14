import { prisma } from "../model/db";
import { humanId } from "human-id";


// fonction pour créer un ID  quiz
// Retourne un ID unique pour un quiz
export async function getUniqueId() {

    const allowedAttempts = 10;

    for(let i = 0; i < allowedAttempts; i++) {
        const id = humanId({
            separator: '-',
            capitalize: false
        });

        let quiz = await prisma.quiz.findUnique({
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

//Fonction pour réinitialiser le quiz
// Recoit un id de quiz en paramètre sous forme de string
// Retourne un objet JSON contenant les questions du quiz réinitialisé
export async function resetProgress(quizId: string) {

    await prisma.quiz.update({
        where: {
            id: quizId
        },
        data: {
            questionCursor: 0
        }
    });

    await prisma.question.updateMany({
        where: {
            quizId: quizId
        },
        data: {
            wasCorrect: false
        }
    });
}