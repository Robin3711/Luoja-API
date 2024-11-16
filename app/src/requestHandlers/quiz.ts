import { prisma } from "../model/db";
import { Request, Response } from "express";
import { fetchQuestions } from "../model/opentdb";
//import { getUniqueId, resetProgress } from "../utils/quizUtils";
import { assert, object, string, refine, enums, optional, array, boolean } from "superstruct";
import { Question } from "@prisma/client";
import { title } from "process";
import { resetProgress } from "../utils/quizUtils";


// Schema for the query parameters of the createQuiz endpoint
const RecupQuerySchema = object({
    amount: refine(string(), 'amount', value => {
        if (isNaN(parseInt(value))) {
            throw new Error('Amount must be a number');
        }
        if (parseInt(value) < 1 || parseInt(value) > 50) {
            throw new Error('Amount must be between 1 and 50');
        }
        return true;
    }
),
category: optional(refine(string(), 'category', value => {
    if (isNaN(parseInt(value))) {
        throw new Error('Category must be a number');
    }
    if (parseInt(value) < 9 || parseInt(value) > 32) {
        throw new Error('Category must be between 9 and 32');
    }
    return true;
})),
difficulty: optional(enums(['easy', 'medium', 'hard']))
});


const QuestionSchema = object({
    question: string(),
    correctAnswer: string(),
    incorrectAnswers: array(string())
});

const CreateQuizQuerySchema = object({
    amount: refine(string(), 'amount', value => {
        if (isNaN(parseInt(value))) {
            throw new Error('Amount must be a number');
        }
        if (parseInt(value) < 1 || parseInt(value) > 50) {
            throw new Error('Amount must be between 1 and 50');
        }
        return true;
    }
    ),
    category: optional(refine(string(), 'category', value => {
        if (isNaN(parseInt(value))) {
            throw new Error('Category must be a number');
        }
        if (parseInt(value) < 9 || parseInt(value) > 32) {
            throw new Error('Category must be between 9 and 32');
        }
        return true;
    })),
    difficulty: optional(enums(['easy', 'medium', 'hard'])),


    title: string(),
    public: optional(boolean()),
    

    //recupérer les questions donc plusieurs questions
    questions: array(QuestionSchema) 
   

});

//Fonction pour donner les question d'un quiz
// Recoit une CreateQuizQuerySchema en paramètre sous forme de Request et une Response
// Retourne ules question que l'utilisateur peut modifier
export async function recup(req: Request, res: Response) {

    try{
        assert(req.query, RecupQuerySchema);

        const amount = req.query.amount as string;
        const category = req.query.category as string | undefined;
        const difficulty = req.query.difficulty as string | undefined;

        const questionData = await fetchQuestions(amount, category, difficulty);    
        
       
        return res.status(200).json({questionData});
    }
    catch (error: any) {
        res.status(400).json({error: error.message});
    }
}

export async function createQuiz(req: Request, res: Response) {

    try{
        assert(req.query, CreateQuizQuerySchema);
        const publicQuiz = req.query.public  as boolean | true;

            const quiz = await prisma.quiz.create({
            data: {
                title: req.query.title as string,
                category: req.query.category as string,
                difficulty: req.query.difficulty as string,
                public:  publicQuiz// Convertir en booléen
            }
        });


      // Parcourez les questions et créez-les
       // Parcourez les questions et créez-les
       for (let question of req.query.questions) {
        let trueFalse = question.incorrectAnswers.length === 1;

        await prisma.question.create({
            data: {
                question: question.question,
                trueFalse: trueFalse,
                correctAnswer: question.correctAnswer,
                falseAnswer1: question.incorrectAnswers[0] || null,
                falseAnswer2: question.incorrectAnswers[1] || null,
                falseAnswer3: question.incorrectAnswers[2] || null,
                quiz: {
                    connect: { id: quiz.id }
                }
            }
        });
    }
    res.status(200).json({quizId: quiz.id});
}
catch (error: any) {
    res.status(400).json({error: error.message});
}
}




//Fonction pour obtenir la question courante
// Recoit un id de quiz en paramètre sous forme de Request et une Response
// Retourne un objet JSON contenant la question et la reponse
export async function getCurrentQuestion(req: Request, res: Response) {
    try{
        const quizId = req.params.id;

        assert(quizId, string());

        const quiz = await prisma.quizGame.findUnique({
            where: {
                id: quizId
            },
            include: {
                quiz: {
                    include: {
                        questions: true
                    }
                }
            }
        });

        if (!quiz) {
            res.status(404).json({erreur: "Quiz non trouvé"});
            return;
        }

        let questionCursor = quiz.questionCursor;

        const question = quiz.quiz.questions[questionCursor];

        let answers = [];

        if (question.trueFalse) {
            answers = [question.correctAnswer, question.falseAnswer1];
        }
        else {
            answers = [question.correctAnswer, question.falseAnswer1, question.falseAnswer2, question.falseAnswer3];
        }

        for (let i = answers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [answers[i], answers[j]] = [answers[j], answers[i]];
        }

        res.status(200).json({
            question: question.question,
            answers: answers
        });
    }
    catch (error: any) {
        res.status(400).json({error: error.message});
    }
}



//Fonction pour vérifier la réponse à la question courante
// Recoit un id de quiz et une réponse en paramètre sous forme de Request et une Response
// Retourne un objet JSON contenant si la réponse est correcte ou non
export async function verifyAnswer(req: Request, res: Response) {

    try{
        const quizId = req.params.id;
        const answer = req.body.answer;

        assert(quizId, string());
        assert(answer, string());

        const quiz = await prisma.quizGame.findUnique({
            where: {
                id: quizId
            },
            include: {
                quiz: {
                    include: {
                        questions: true
                    }
                }
            }
        });

        if (!quiz) {
            throw new Error("Quiz non trouvé");
        }

        let questionCursor = quiz.questionCursor;

        const question = quiz.quiz.questions[questionCursor];

        const correctAnswer = question.correctAnswer;

        const wasCorrect = answer === correctAnswer;
        
        await prisma.quizGameResponse.update({
            where: {
                questionId_gameId: {
                    questionId: question.id,
                    gameId: quizId    
                }    
            },

            data: {
                response: wasCorrect
        }}
    );

        let nextQuestion = questionCursor + 1;

        if (questionCursor === quiz.quiz.questions.length - 1) {
            await resetProgress(quizId)
        }
        else {
            await prisma.quizGame.update({
                where: {
                    id:  quizId
                },
                data: {
                    questionCursor: nextQuestion
                }
            });
        }

        res.status(200).json({correct: wasCorrect});
    }
    catch (error: any) {
        res.status(400).json({error: error.message});
    }
}


//Fonction pour obtenir les informations du quiz
// Recoit un id de quiz en paramètre sous forme de Request et une Response
// Retourne un objet JSON contenant les résultats, le curseur de question et le nombre de questionsYYYYY
export async function getInfos(req: Request, res: Response) {
    try{
        const quizId = req.params.id;

        assert(quizId, string());

        const quiz = await prisma.quizGame.findUnique({
            where: {
                id: quizId
            },
            include: {
                quiz: {
                    include: {
                        questions: true
                    }
                }
            }
        });

        if (!quiz) {
            throw new Error("Quiz non trouvé");
        }

        const numberOfQuestions = quiz.quiz.questions.length;

        const questionCursor = quiz.questionCursor;

        let results = [];
        let questionsIds = quiz.quiz.questions.map((question: Question) => question.id);
        for (let questionId of questionsIds) {
            let response = await prisma.quizGameResponse.findUnique({
                where: {
                    questionId_gameId: {
                        questionId: questionId,
                        gameId: quizId
                    }
                }
            });

            if (!response) {
                throw new Error("Réponse non trouvée");
            }

            results.push(response.response);
        }
      

      
        res.status(200).json({results: results, questionCursor: questionCursor, numberOfQuestions: numberOfQuestions});
    }
    catch (error: any) {
        res.status(400).json({error: error.message});
    }    
}