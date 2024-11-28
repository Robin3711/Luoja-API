# Mimir - API

## Table des matières

1. [Mimir - API](#mimir---api)
2. [Documentation API](#documentation-api)
    - [Le quiz](#route-pour-le-quiz)
      - [Créer un quiz](#post-quiz)
      - [Publier un quiz](#get-quizidpublish)
      - [Récupérer son quiz](#get-quizidretrieve)
      - [Rechercher un quiz](#get-quizlist)
      - [Modifier un quiz](#post-quizidedit)
      - [Créer une partie rapide](#get-quizfast)
      - [Jouer à un quiz](#get-quizidplay)
      - [Cloner un quiz](#get-quizidclone)
    - [La partie](#route-pour-la-partie)
        - [Récupérer la question courante d'une partie](#get-gameidquestion)
        - [Récupérer la réponse d'une question](#post-gameidanswer)
      - [Récupérer les informations de la partie](#get-gameidinfos)
      - [Moyenne score d'une partie](#get-gameidaverage)
      - [Lancer une nouvelle partie](#get-gameidrestart)
    - [L'utilisateur](#route-pour-lutilisateur)
      - [Enregistrer un utilisateur](#post-userregister)
      - [Se connecter](#post-userlogin)
      - [Récupérer les informations de l'utilisateur](#get-userinfos)
      - [Récupérer les quiz d'un utilisateur](#get-useridcreatedquizs)
3. [Commande de lancement de l'API en dev](#commande-de-lancement-de-lapi-en-dev)
4. [Commande de lancement de l'image WEB en production](#commande-de-lancement-de-limage-web-en-production)
5. [CI/CD : Organisation du Pipeline](#cicd--organisation-du-pipeline)
   - [Stages](#stages)
     - [1. build](#1-build)
     - [2. lint et tests](#2-lint-et-tests)
     - [3. pages](#3-pages)


## Documentation API

### Route pour le quiz

#### **POST** /quiz

*Permet de créer un quiz personnalisé.*

Example de requête : 
```
http://localhost:3000/quiz?category=9&difficulty=easy&title=Montitre&public=true
```

Paramètres :
- category : Catégorie des questions du quiz (optionnel)
- difficulty : Difficulté des questions (optionnel)
- title : Titre du quiz
- public : Visibilité du quiz (optionnel)

Corps de la requête : Les questions du quiz.

```json
{
  "questions": [
    {
      "text": "Chocolatine ?",
      "correctAnswer": "Vrai",
      "incorrectAnswers": ["False"]
    }
  ]
}
```

Valeur de retour : L'identifiant du quiz créé.

```json
{
  "quizId": 1
}
```

#### **GET** /quiz/:id/publish

*Permet de publier un quiz.*

Example de requête :

```
http://localhost:3000/quiz/1/publish
```

Paramètres :
- id : ID du quiz.

Headers :
- token : Token d'authentification de l'utilisateur.

Valeur de retour : L'identifiant du quiz.

```json
{
  "quizId": 1
}
```

#### **GET** /quiz/:id/retrieve

*Permet de récupérer un quiz dont on est l'auteur.*

Example de requête :

```
http://localhost:3000/quiz/1/retrieve
```

Paramètres :
- id : ID du quiz.

Valeur de retour : Les informations du quiz.

Headers :
- token : Token d'authentification de l'utilisateur.

```json
{
  "title": "Montitre",
  "category": 9,
  "difficulty": "easy",
  "public": true,
  "questions": [
    {
      "text": "Chocolatine ?",
      "correctAnswer": "Vrai",
      "incorrectAnswers": ["False"]
    }
  ]
}
```

#### **GET** /quiz/list

*Permet de rechercher un quiz par son titre.*

Example de requête :

```
http://localhost:3000/quiz/list?title=Montitre&category=9&difficulty=easy
```

Paramètres :
  - category : Catégorie des questions du quiz (optionnel)
  - difficulty : Difficulté des questions (optionnel)
  - title : Titre du quiz (optionnel)

Valeur de retour : Les quiz correspondant à la recherche.
  
  ```json
  [
    {
      "id": 1,
      "title": "Montitre",
      "category": 9,
      "difficulty": "easy",
      "public": true
    }
  ]
```

#### **POST** /quiz/:id/edit

*Permet de modifier un quiz.*

Example de requête : 
```
http://localhost:3000/quiz/1/edit?category=9&difficulty=easy&title=Montitre&public=true
```

Paramètres :
- category : Catégorie des questions du quiz (optionnel)
- difficulty : Difficulté des questions (optionnel)
- title : Titre du quiz
- public : Visibilité du quiz (optionnel)

Corps de la requête : Les questions du quiz.

```json
{
  "questions": [
    {
      "text": "Chocolatine ?",
      "correctAnswer": "Vrai",
      "incorrectAnswers": ["False"]
    }
  ]
}
```

Valeur de retour : L'identifiant du quiz créé.

```json
{
  "quizId": 1
}
```

#### **GET** /quizFast

*Permet de créer une partie rapide générer automatiquement*

Example de requête :

```
http://localhost:3000/quizFast?amount=23&category=15&difficulty=hard
```

Valeur de retour : L'identifiant de la partie.
```json
{
  "id": "dry-planets-cover"
}
```

#### **GET** /quiz/:id/play

*Permet de jouer à un partie*

Example de requête :
```
http://localhost:3000/quiz/1/play
```

Paramètres :
- id : ID du quiz.


Valeur de retour : L'identifiant de la partie.
```json
{
  "id": "lemon-ghosts-roll"
}
```

#### **GET** /quiz/:id/clone

*Permet de cloner un quiz*

Example de requête :

```
http://localhost:3000/quiz/1/clone
```

Paramètres :
  - id : ID du quiz à cloner.

Valeur de retour : Le clone du quiz.

```json
{
  "questions": [
      {
          "question": "Chocolatine ?",
          "correctAnswer": "Vrai",
          "incorrectAnswers": [
              "False"
          ],
      }
  ]
}
```

### Route pour la partie

#### **GET** /game/:id/question

*Permet de récupérer le question courante d'une partie*

Example de requête :

```
http://localhost:3000/game/samuel-love-potatoes/question
```

Paramètres :
- id : ID de la partie.

Headers :
- token : Token d'authentification de l'utilisateur.

Valeur de retour : La question courante de la partie.

```json
{
  "question": "Chocolatine ?",
  "answers": [
    "Vrai",
    "False"
  ]
}
```

#### **POST** /game/:id/answer

*Permet de vérifier la réponse d'une question*

Example de requête :

```
http://localhost:3000/game/samuel-love-potatoes/answer
```

Paramètres :
- id : ID de la partie.

Headers :
- token : Token d'authentification de l'utilisateur.

Corps de la requête : La réponse de l'utilisateur.

```json
{
  "answer": "Vrai"
}
```

Valeur de retour : La réponse de l'utilisateur.

```json
{
  "correctAnswer": "Vrai"
}
```

#### **GET** /game/:id/infos

*Permet de connaitre les informations de la partie*

Example de requête :

```
http://localhost:3000/game/samuel-love-potatoes/infos
```

Paramètres :
- id : ID de la partie.

Headers :
- token : Token d'authentification de l'utilisateur.

Valeur de retour : Les informations de la partie.

```json
{
  "results": [
      false
  ],
  "questionCursor": 0,
  "numberOfQuestions": 1,
  "Difficulty":"hard",
  "Category": 9,
  "Date":"2023-10-05T14:48:00.000Z"
}
```

#### **GET** /game/:id/average

*Permet de connaître son score sur un quiz*

Exemple de requête :

```
http://localhost:3000/game/copilote-est-surcote/average
```


Paramètres :

-id : ID de la partie.
Headers :

-token : Token d'authentification de l'utilisateur.
Valeur de retour : La moyenne des scores pour le quiz spécifié.
```json
{
  "averageScore": 75
}
```

#### **GET** /game/:id/restart

*Permet de recommencer une partie*

Exemple de requête

```
http://localhost:3000/game/veux-un-vingt/restart
```

Paramètres :
- id : ID de la partie.

Headers :
- token : Token d'authentification de l'utilisateur.


Valeur de retour 
```json
{
    "id": "theo-aime-patates"
}
```

### Route pour l'utilisateur

#### **POST** /user/register

*Permet d'enregistrer un nouvel utilisateur.*

Example de requête : 
```
http://localhost:3000/user/register
```

Corps de la requête : Les informations de l'utilisateur.

```json
{
  "email" : "test@luoja.fr",
  "password" : "mysupersecurepassword"
}
```

Valeur de retour : Le token d'authentification de l'utilisateur.

```json
{
  "token": "supersecuretoken"
}
```

#### **POST** /user/login 

*Permet de connecter un utilisateur.*

Example de requête : 
```
http://localhost:3000/user/login
```

Corps de la requête : Les informations de l'utilisateur.

```json
{
  "email" : "test@luoja.fr",
  "password" : "mysupersecurepassword"
}
```

Valeur de retour : Le token d'authentification de l'utilisateur

```json
{
  "token": "supersecuretoken"
}
```

#### **GET** /user/infos

*Permet de récupérer les informations de l'utilisateur.*

Example de requête : 
```
http://localhost:3000/user/infos
```

Headers :
- token : Token d'authentification de l'utilisateur

Valeur de retour : Les informations de l'utilisateur.

```json
{
  "user": {
    "id": 1,
    "email": "test@luoja.fr"
  }
}
```

#### **Get** /user/:id/createdQuizs

*Permet de consulter les quiz créer d'un utilisateur.*

Example de requête : 
```
http://localhost:3000/user/some-user-id/createdQuizs
```

Paramètres :

id : ID de l'utilisateur.
Headers :

token : Token d'authentification de l'utilisateur.


Valeur de retour : Le token d'authentification de l'utilisateur.

```json
 {
    "id": 1,
    "title": "Sample Quiz",
    "category": 0,
    "difficulty": "easy",
    "public": true,
    "createdAt": "2023-10-05T14:48:00.000Z",
    "updatedAt": "2023-10-05T14:48:00.000Z"
  },
  {
    "id": 2,
    "title": "Another Quiz",
    "category": 1,
    "difficulty": "medium",
    "public": false,
    "createdAt": "2023-10-05T14:48:00.000Z",
    "updatedAt": "2023-10-05T14:48:00.000Z"
  }
```

## Commande de lancement de l'API en dev

```bash
sudo docker run -it -p 3000:3000 --name mimir docker.luoja.fr/mimir
```

## Commande de lancement de l'image WEB en production

```bash
sudo docker run -d --restart always --name mimir --network internal_network \
-e PROTOCOL=HTTPS \
-e DOMAIN=luoja.fr \
-v /etc/letsencrypt:/etc/letsencrypt:ro \
-v /srv/mimir/mimir.db:/usr/src/app/prisma/mimir.db \
docker.luoja.fr/mimir
```

---

### CI/CD : Organisation du Pipeline : 

L'objectif du pipeline de ce projet est de corriger le code, et de déployer régulièrement 
des version stables de l'application.

La finalité est de n'avoir sur dev et les branches suivantes que du code propre et fonctionnel,
et d'avoir à tout moment une API fonctionnel

#### stages : 
		
1. build :   
		- build de l'image docker de l'API  
		- réalisé à chaque commit sur main ou release pour avoir une version prête à déployer.  
		- image docker stocké sur le dépot docker de l'équipe.  		

2. lint et tests :   
		- linting et tests unitaires du code.   
		- réalisé à chaque commit sur la branche dev pour vérifier que le code marche encore.  
		- résultats affiché dans les pages.  
 
3. pages :   
		- affiche les résultats du linting et des tests.   