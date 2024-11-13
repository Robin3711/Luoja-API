import { fetchQuestions } from '../src/model/opentdb';

describe('fetchQuestions', () => {
    beforeEach(() => {
        fetch.resetMocks();
    });

    it('devrait retourner le bon format de fichier', async () => {
        const mockApiResponse = {
            response_code: 0,
            results: [
                {
                    type: "boolean",
                    difficulty: "easy",
                    category: "Entertainment: Video Games",
                    question: "In Until Dawn, both characters Sam and Mike cannot be killed under any means until the final chapter of the game.",
                    correct_answer: "True",
                    incorrect_answers: ["False"]
                },
                // Ajoutez d'autres questions ici si nécessaire
            ]
        };

        fetch.mockResponseOnce(JSON.stringify(mockApiResponse));

        const data = await fetchQuestions('10', '9', 'easy');

        expect(data).toEqual(mockApiResponse);
        expect(data.response_code).toBe(0);
        expect(data.results).toBeInstanceOf(Array);
        data.results.forEach((question: any) => {
            expect(question).toHaveProperty('type');
            expect(question).toHaveProperty('difficulty');
            expect(question).toHaveProperty('category');
            expect(question).toHaveProperty('question');
            expect(question).toHaveProperty('correct_answer');
            expect(question).toHaveProperty('incorrect_answers');
        });
    });
});