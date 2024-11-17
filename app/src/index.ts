import express, { Request, Response } from "express";
import cors from 'cors';

import * as quiz from './requestHandlers/quiz';
import * as user from './requestHandlers/user';

const app = express();
const PORT = 3000;
const PROTOCOL = process.env.PROTOCOL || 'HTTP'; // 'http' par défaut
const DOMAIN = process.env.DOMAIN || 'localhost'; // 'localhost' par défaut

const fs = require('fs');
const https = require('https');

app.use(cors());

app.use(express.json());

// Route get de l'API pour recupérer les question d'un quiz
app.get("/quiz", async (req: Request, res: Response) => {
    quiz.recup(req, res);
});

// Route post de l'API pour créer un quiz
app.post("/quiz", async (req: Request, res: Response) => {
    quiz.createQuiz(req, res);
});


// Route get de l'API pour obtenir la question courante
app.get("/quiz/:id/question", async (req: Request, res: Response) => {
    quiz.getCurrentQuestion(req, res);
});

// Route post de l'API pour vérifier la réponse à la question courante
app.post("/quiz/:id/answer", async (req: Request, res: Response) => {
    quiz.verifyAnswer(req, res);
});

// Route get de l'API pour obtenir les informations du quiz
app.get("/quiz/:id/infos", async (req: Request, res: Response) => {
  quiz.getInfos(req, res);
});


//Route pour pouvoir jouer à un quiz
app.post("/quiz/:id/play", async (req: Request, res: Response) => {
  quiz.playQuiz(req, res);
});



app.post('/user/register', (req: Request, res: Response) => {
  user.createUser(req, res);
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