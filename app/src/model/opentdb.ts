export async function fetchQuestions(amount: string, category: string, difficulty: string) {
    const response = await fetch(`https://opentdb.com/api.php?amount=${amount}&category=${category}&difficulty=${difficulty}`);

    const data = await response.json(); 

    if (data.response_code !== 0) {
        throw new Error("Erreur lors de la récupération des questions");
    }

    return data;
}