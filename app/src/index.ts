import cors from 'cors';
import express, { Request, Response } from "express";

import * as quiz from './requestHandlers/quiz';
import * as game from './requestHandlers/game';
import * as user from './requestHandlers/user';

const app = express();
const PORT = 3000;
const PROTOCOL = process.env.PROTOCOL || 'HTTP'; // 'http' par défaut
const DOMAIN = process.env.DOMAIN || 'localhost'; // 'localhost' par défaut

const fs = require('fs');
const https = require('https');

app.use(cors());

app.use(express.json());

// Route post de l'API pour créer un quiz
app.post("/quiz", async (req: Request, res: Response) => {
  quiz.create(req, res);
});

// Route get de l'API pour récupérer des questions de l'API OpenTDB
app.get("/questions", async (req: Request, res: Response) => {
  quiz.getOpentTDBQuestions(req, res);
});

//Route pour pouvoir jouer à un quiz
app.get("/quiz/:id/play", async (req: Request, res: Response) => {
  game.create(req, res);
});


app.get("/game/:id/restart", async (req: Request, res: Response) => {
  game.restart(req, res);
});

// Route get de l'API pour obtenir la question courante
app.get("/game/:id/question", async (req: Request, res: Response) => {
  game.getCurrentQuestion(req, res);
});

// Route post de l'API pour vérifier la réponse à la question courante
app.post("/game/:id/answer", async (req: Request, res: Response) => {
  game.verifyCurrentQuestionAnswer(req, res);
});

// Route get de l'API pour obtenir les informations du quiz
app.get("/game/:id/infos", async (req: Request, res: Response) => {
  game.getInfos(req, res);
});

// Route get de l'API pour obtenir une liste de quiz
app.get("/quiz/list", async (req: Request, res: Response) => {
  quiz.list(req, res);
});

// Route pour cloner un quiz
app.get('/quiz/:id/clone', async (req: Request, res: Response) => {
  quiz.clone(req, res);
});

// Route get de l'API pour crée un quiz Rapid 
app.get("/quizFast", async (req: Request, res: Response) => {
  quiz.fastCreate(req, res);
});

//Route get de l'api pour recuperer les quiz crée de l'utilisateur

app.get("/quiz/user", async (req: Request, res: Response) => {
  user.getUserCreateQuiz(req, res);
});

app.post('/user/register', (req: Request, res: Response) => {
  user.create(req, res);
});

app.post('/user/login', (req: Request, res: Response) => {
  user.login(req, res);
});

app.get('/user/infos', (req: Request, res: Response) => {
  user.getInfos(req, res);
});

if (PROTOCOL === 'HTTPS') {
  // Configuration du serveur HTTPS
  const sslOptions = {
    key: fs.readFileSync(`/etc/letsencrypt/live/${DOMAIN}/privkey.pem`, 'utf8'),
    cert: fs.readFileSync(`/etc/letsencrypt/live/${DOMAIN}/fullchain.pem`, 'utf8'),
  };

  // Créer un serveur HTTPS
  https.createServer(sslOptions, app).listen(PORT, () => {
    console.log(`🚀 Serveur HTTPS lancé sur https://${DOMAIN}:${PORT}`);
  });
} else {
  // Créer un serveur HTTP
  app.listen(PORT, () => {
    console.log(`🚀 Serveur HTTP lancé sur http://${DOMAIN}:${PORT}`);
  });
}