import { decode } from 'html-entities';

function decodeHtml(html: string): string {
    return decode(html);
}


// Fonction qui permet de récupérer des questions depuis l'API OpenTDB
// Recoit un nombre de questions à récupérer sous forme de string
// Peut recevoir une catégorie et une difficulté sous forme de string
// Retourne un objet JSON contenant les questions
export async function fetchQuestions(amount: string, category?: string, difficulty?: string) {

    let url = `https://opentdb.com/api.php?amount=${amount}`;

    if (category) {
        url += `&category=${category}`;
    }

    if (difficulty) {
        url += `&difficulty=${difficulty}`;
    }

    const response = await fetch(url);

    const data = await response.json();

    if (data.response_code !== 0) {
        throw new Error("Erreur lors de la récupération des questions");
    }

    data.results.forEach((item: any) => {
        item.question = decodeHtml(item.question);
        item.correct_answer = decodeHtml(item.correct_answer);
        item.incorrect_answers = item.incorrect_answers.map((answer: string) => decodeHtml(answer));
    });

    return data;
}
