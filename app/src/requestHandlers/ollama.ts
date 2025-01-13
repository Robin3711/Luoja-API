import { Request, Response } from 'express';
import { assert, string } from 'superstruct';

import * as userUtils from '../utils/userUtils';

export async function generateCompletion(req: Request, res: Response) {
    try {
        const question = req.body.question;
        const theme = req.body.theme;

        assert(question, string());
        assert(theme, string());

        const user = await userUtils.getUser(req);
        
        if (!user) {
            throw new Error("Utilisateur non trouvé");
        }

        // Vérification de la taille des champs
        if (question.length > 100 || theme.length > 100) {
            throw new Error("Les champs ne peuvent pas dépasser 100 caractères");
        }

        const url = 'http://ollama:11434/api/generate';
        
        const data = {  
            model: 'llama3.2:1b',
            system: 
            `Tu vas recevoir une question ainsi qu'un thème.
            Génère 4 réponses possibles qui correspondent au thème, la première étant la bonne réponse.
            Ne génère pas deux fois la même réponse.`,
            prompt: `Question: ${question} Theme: ${theme}`,
            format: {
                properties: {
                    answer1: {
                        type: "string"
                    },
                    answer2: {
                        type: "string"
                    },
                    answer3: {
                        type: "string"
                    },
                    answer4: {
                        type: "string"
                    }
                },
                required: [
                    "answer1",
                    "answer2",
                    "answer3",
                    "answer4",
                ]
            },
            stream: false,
            temperature: 0.5,
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });     
    
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
    
        const completion = await response.json();

        const output = JSON.parse(completion.response);

        const answers = [output.answer1, output.answer2, output.answer3, output.answer4];

        res.status(200).json({answers: answers});

    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
  }