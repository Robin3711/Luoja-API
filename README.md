# Mimir - API

## Documentation API


### **GET** /quiz : Permet de créer un nouveau quiz paramétré.

Example de requête : 
```
http://localhost:3000/quiz?amount=5&category=9&difficulty=easy
```

Paramètres :
- amount : Nombre de questions à récupérer
- category : Catégorie de questions à récupérer
- difficulty : Difficulté des questions à récupérer

Valeur de retour : L'identifiant du quiz créé.

```json
{
  "quizId": "large-laws-chew"
}
```

### **GET** /quiz/:id/question : Permet de récupérer la question courante du quiz.

Example de requête : 
```
http://localhost:3000/quiz/large-laws-chew/question
```

Paramètres :
- id : Identifiant du quiz

Valeur de retour : La question courante du quiz.

```json
{
  "question": "Romanian belongs to the Romance language family, shared with French, Spanish, Portuguese and Italian. ",
  "answers": [
    "True",
    "False"
  ]
}
```

### **POST** /quiz/:id/answer : Permet de répondre à la question courante du quiz.

Example de requête : 
```
http://localhost:3000/quiz/large-laws-chew/answer
```

Paramètres :
- id : Identifiant du quiz

Corps de la requête : La réponse à la question courante du quiz.

```json
{
  "answer": "True"
}
```

Valeur de retour : La réponse est-elle correcte ?

```json
{
    "correctAnswer": "False"
}
```

### **GET** /quiz/:id/infos : Permet de récupérer les informations du quiz.

Example de requête : 
```
http://localhost:3000/quiz/large-laws-chew/infos
```

Paramètres :
- id : Identifiant du quiz

Valeur de retour : Les résultats du quiz.

```json
{
  "results": [false, false, false, false, false, false, false, false, false, false],
  "questionCursor": 0,
  "numberOfQuestions": 10
}
```