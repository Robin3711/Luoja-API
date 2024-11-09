import express, { Request, Response } from 'express';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const port = 3000;
const prisma = new PrismaClient();

app.use(express.json());

// Fonction pour récupérer les questions de l'API avec gestion des erreurs et des tentatives
const fetchQuestions = async (amount: number, category: number, difficulty: string) => {
  const maxRetries = 3;
  let retries = 0;
  while (retries < maxRetries) {
    try {
      const response = await axios.get(`https://opentdb.com/api.php?amount=${amount}&category=${category}&difficulty=${difficulty}`);
      return response.data.results;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response && error.response.status === 429) {
        retries++;
        console.log(`Limite de requêtes dépassée. Nouvelle tentative... (${retries}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Attendre 2 secondes avant de réessayer
      } else {
        throw error;
      }
    }
  }
  throw new Error('Échec de la récupération des questions après plusieurs tentatives');
};

// Route pour récupérer les questions de l'API et les insérer dans la base de données
app.get('/fetch-questions', async (req: Request, res: Response) => {
  try {
    const { amount = 10, category = 9, difficulty = 'medium' } = req.query;
    const questions = await fetchQuestions(Number(amount), Number(category), String(difficulty));

    const qcmId = uuidv4();

    // Créer un nouveau QCM
    const qcm = await prisma.qCM.create({
      data: {
        id: qcmId,
        currentQuestion: 0,
      },
    });

    // Insérer les questions dans la base de données
    let questionNumber = 1;
    for (const question of questions) {
      const correctAnswers = [false, false, false, false];
      const answers = [...question.incorrect_answers, question.correct_answer];

      // S'assurer qu'il y a exactement 4 réponses
      while (answers.length < 4) {
        answers.push('');
      }

      correctAnswers[answers.indexOf(question.correct_answer)] = true;

      await prisma.question.create({
        data: {
          qcmId: qcm.id,
          questionNumber: questionNumber++,
          question: question.question,
          answer1: answers[0] || '',
          answer2: answers[1] || '',
          answer3: answers[2] || '',
          answer4: answers[3] || '',
          correct1: correctAnswers[0],
          correct2: correctAnswers[1],
          correct3: correctAnswers[2],
          correct4: correctAnswers[3],
        },
      });
    }

    res.json({ message: 'Questions récupérées et stockées avec succès', qcmId });
  } catch (error) {
    console.error('Détails de l\'erreur:', error);
    const errorMessage = (error as any).message;
    res.status(500).json({ error: 'Une erreur est survenue lors de la récupération des questions', details: errorMessage });
  }
});

// Route pour supprimer toutes les données de la base de données
app.delete('/delete-all', async (req: Request, res: Response) => {
  try {
    await prisma.question.deleteMany({});
    await prisma.qCM.deleteMany({});
    res.json({ message: 'Toutes les données ont été supprimées avec succès' });
  } catch (error) {
    console.error('Détails de l\'erreur:', error);
    const errorMessage = (error as any).message;
    res.status(500).json({ error: 'Une erreur est survenue lors de la suppression des données', details: errorMessage });
  }
});

// Route pour supprimer un QCM spécifique et ses questions associées
app.delete('/delete-qcm/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.question.deleteMany({ where: { qcmId: id } });
    await prisma.qCM.delete({ where: { id } });
    res.json({ message: `Le QCM avec l'ID ${id} et ses questions associées ont été supprimés avec succès` });
  } catch (error) {
    console.error('Détails de l\'erreur:', error);
    const errorMessage = (error as any).message;
    res.status(500).json({ error: 'Une erreur est survenue lors de la suppression du QCM', details: errorMessage });
  }
});

app.listen(port, () => {
  console.log(`Application exemple écoutant sur le port ${port}`);
});