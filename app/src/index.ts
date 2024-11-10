import express, { Request, Response, NextFunction } from "express";
import * as quiz from './requestHandlers.ts/quiz';

const app = express();
const port = 3000;

app.use(express.json());

app.get("/quiz", async (req: Request, res: Response) => {
    quiz.createQuiz(req, res);
});

app.get("/quiz/:id/question", async (req: Request, res: Response) => {
    quiz.getCurrentQuestion(req, res);
});

app.post("/quiz/:id/answer", async (req: Request, res: Response) => {
    quiz.verifyCurrentQuestionAnswer(req, res);
});

app.get("/quiz/:id/results", async (req: Request, res: Response) => {
    quiz.getResults(req, res);
});

app.listen(port, () => {
  console.log(`Application exemple écoutant sur le port ${port}`);
});