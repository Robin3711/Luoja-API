import fetchMock from 'jest-fetch-mock';
import { fetchQuestions } from '../src/model/opentdb';

fetchMock.enableMocks(); // Active les mocks de fetch

describe('fetchQuestions', () => {
    beforeEach(() => {
        fetchMock.resetMocks(); // Réinitialise les mocks entre chaque test
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
                }
            ]
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockApiResponse));

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

    it('devrait lancer une erreur si l’API renvoie un code d’erreur', async () => {
        const mockErrorResponse = {
            response_code: 1, // Code d'erreur simulé
            results: []
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockErrorResponse));

        await expect(fetchQuestions('10', '9', 'easy')).rejects.toThrow("Erreur lors de la récupération des questions");
    });
});
