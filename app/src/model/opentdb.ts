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

    return data;
}