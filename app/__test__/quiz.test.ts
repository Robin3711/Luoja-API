    import { Request, Response } from "express";
    import { create, getCurrentQuestion, verifyAnswer, getInfos } from "../src/requestHandlers/quiz";
    import { resetProgress } from "../src/utils/quizUtils";
    import { prisma } from "../src/model/db";
    import { fetchQuestions } from "../src/model/opentdb";
    import { humanId } from "human-id";

    jest.mock('../model/db');

    describe('Quiz API Tests', () => {
        afterEach(async () => {
            jest.clearAllMocks();
        });


        
});