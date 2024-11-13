import express, { Request, Response } from "express";
import cors from 'cors';

import * as quiz from './requestHandlers/quiz';

const app = express();
const PORT = 3000;
const PROTOCOL = process.env.PROTOCOL || 'HTTP'; // 'http' par défaut
const DOMAIN = process.env.DOMAIN || 'localhost'; // 'localhost' par défaut

const fs = require('fs');
const https = require('https');

app.use(cors());

app.use(express.json());

app.get("/quiz", async (req: Request, res: Response) => {
    quiz.createQuiz(req, res);
});

app.get("/quiz/:id/question", async (req: Request, res: Response) => {
    quiz.getCurrentQuestion(req, res);
});

app.post("/quiz/:id/answer", async (req: Request, res: Response) => {
    quiz.verifyAnswer(req, res);
});

app.get("/quiz/:id/infos", async (req: Request, res: Response) => {
  quiz.getInfos(req, res);
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