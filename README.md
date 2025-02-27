# Mimir - API

 API du Projet Luoja réalisé pendant le 5ème semestre du BUT informatique. Luoja est une application permettant de créer et de jouer à des quizz 

 ### Collaborateurs

 Cette API à été développé par par notre équipe de projet constitué d'élèves de 3ème année de BUT informatique à l'IUT Robert-Schuman d'Ilkirch en 2024-2025 : 

 - Guillaume Behr (https://github.com/guillaume-behr)
 - Saif Zouaoui-mahjoub (https://github.com/zaouaoua)
 - Samuel Marsault (https://github.com/SamuelMarsault)
 - Mattéo Gillig (https://github.com/Spidermatou)
 - Théo Willem (https://github.com/TheoWillem) 
 - Miniotti Robin (https://github.com/Robin3711)

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
      "incorrectAnswers": ["False"],
      "type": "text"
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
      "incorrectAnswers": ["False"],
      "type": "text"
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
      "incorrectAnswers": ["False"],
      "type": "text"
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

#### **GET** /game/:id/score
*Permet d'obtenir dun score*
Example de requête :
```
http://localhost:3000/game/:id/score
```

Paramètres :
- id : ID du quiz.


Valeur de retour : Le score moyenne de la partie 
```json
{
  "averageScore": "75"
}
```
#### **GET** /quiz/:id/play

*Permet de jouer à un partie*
Example de requête :
```
http://localhost:3000/quiz/1/play?gameMode=timed
```

Paramètres :
- id : ID du quiz.

Query :
- gameMode : Mode de jeu (optionnel) ("standard", "timed")

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
          "text": "Chocolatine ?",
          "correctAnswer": "Vrai",
          "incorrectAnswers": [
              "False"
          ],
          "type": "text"
      }
  ]
}
```

#### **GET** /quiz/user/game

*Permet d'obtenir une liste de quiz jouer par un utilisateur
*

Exemple de requête

```
http://localhost:3000/quiz/user/game
```
Headers :
- token : Token d'authentification de l'utilisateur.


Valeur de retour 
```json
{
  "games" [
      {
          "id": "je_suis_game",
          "userId": "43",
          "quizId": "4",
         "createdAt":"2023-10-05T14:48:00.000Z"
      },
       {
          "id": "autre_game",
          "userId": "44",
          "quizId": "5",
         "createdAt":"2023-10-05T14:48:00.000Z"
      }
  ]
  
}
```

#### **GET** /quiz/user/create
*recuperer les quiz crée de l'utilisateur*

```
http://localhost:3000/quiz/user/create
```
Headers :
- token : Token d'authentification de l'utilisateur.

Valeur de retour 
```json
{
  "result" [
      {
          "id": "5",
          "title": "Title",
          "category": "4",
          "difficulty": "4",
          "public":"true",
          "createdAt":"2023-10-05T14:48:00.000Z",
          "updatedAt":"2023-10-05T14:48:00.000Z",
          "numberOfQuestions":"10"
      },
      {
          "id": "6",
          "title": "AutreTitre",
          "category": "5",
          "difficulty": "1",
          "public":"false",
          "createdAt":"2023-10-05T14:48:00.000Z",
          "updatedAt":"2023-10-05T14:48:00.000Z",
          "numberOfQuestions":"234"
      },
  ]
  
}
```

### Route pour la partie

#### **GET** /game/:id/question

*Permet de récupérer l question courante d'une partie*

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
  "type": "text",
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


#### **delete** /quiz/:id/delete

*Permet de supprimer un quiz*

Example de requête :

```
http://localhost:3000/quiz/1/delete
```

Paramètres :
- id : ID du. quiz


Headers :
- token : Token d'authentification de l'utilisateur.

Valeur de retour :.

```json
{
    "message": "Quiz supprimé"
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
  "quizDifficulty":"hard",
  "quizCategory": 9,
  "gameDifficulty":"hard",
  "gameMode":"timed",
  "Date":"2023-10-05T14:48:00.000Z",
  "Title":"Montitre",
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

#### **GET** /game/:id/timer

*Permet d'écouter le timer de la partie sur la question courante.*

Example de requête : 
```
http://localhost:3000/game/:id/timer?token=supersecuretoken
```

Valeur de retour : SSE renvoyant le temps restant avant la fin de la partie.

```json
{
  "time": 10
}
```



#### **delete** /game/:id/delete

*Permet de supprimer un game*

Example de requête :

```
http://localhost:3000/game/lucky-humans-learn/delete
```

Paramètres :
- id : ID de la game.


Headers :
- token : Token d'authentification de l'utilisateur.

Valeur de retour :.

```json
{
    "message": "Partie supprimée"
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

### Route pour les partis multijoueur

#### **GET** /room/:id/create

*Permet de créer une room multijoueur*

Example de requête :

```
http://localhost:3000/room/1/create?playerCount=2&?difficulty=easy&?gameMode=team
```

Paramètres :
- id : ID du quiz.

Query :
- playerCount : Nombre de joueurs dans la partie.
- difficulty : Difficulté des questions (optionnel)
- gameMode : Mode de jeu (optionnel) ("scrum", "team")

Headers :
- token : Token d'authentification de l'utilisateur.

Valeur de retour : L'identifiant de la room.

```json
{
  "id": "tst-room"
}
```

#### **GET** /room/:id/join

*Permet de rejoindre la partie et d'écouter son flux SSE*

Example de requête : 
```
http://localhost:3000/room/1/join?token=supersecuretoken
```

Valeur de retour : SSE envoyant les informations de la partie

Types de message et exemples : 

connectionEstablished : Confirme la connexion au flux SSE.



```json
{"eventType":"connectionEstablished", "gameMode": "room.gameMode"}	
```

playerJoined : Liste des joueurs présents dans la room.

```json
{"eventType":"playerJoined","players":["test"]}	
```

teams : Liste des joueurs présents dans la room avec leurs équipes.

```json
{"eventType":"teams","teams": [{"name": "test", "players": ["test"]}]}	
```

timer : Notification du timer de la question.

```json
{"eventType":"timer","remainingTime":10}	
```

gameStart : Notification du début de la partie.

```json
{"eventType":"gameStart"}	
```

quizInfos :

```json
{"eventType":"quizInfos","totalQuestion":6}	
```

nextQuestion : Notification de la prochaine question.

```json
{"eventType":"nextQuestion"}	
```

correctAnswerFound : Un joueur a trouvé la bonne réponse.

```json
{"eventType":"correctAnswerFound","user":"test","correctAnswer":"Gorilla"}	
```

gameEnd : Notification de la fin de la partie.

```json
{"eventType":"gameEnd"}
```

#### **POST** /room/:id/question

*Permet de recevoir la question actuelle*

Example de requête :

```
http://localhost:3000/room/1/question
```

Paramètres :
- id : ID de la room.

Headers :
- token : Token d'authentification de l'utilisateur.

Valeur de retour : La question courante de la partie.

```json
{
  "question": "Chocolatine ?",
  "type": "text",
  "answers": [
    "Vrai",
    "False"
  ]
}
```


#### **POST** /room/:id/answer

*Permet de vérifier la réponse d'une question*

Example de requête :

```
http://localhost:3000/room/1/answer
```

Paramètres :
- id : ID de la room.

Headers :
- token : Token d'authentification de l'utilisateur.

Corps de la requête : La réponse de l'utilisateur.

```json
{
  "answer": "Vrai"
}
```

#### **GET** /room/:id/scores

*Permet de récupérer les scores des joueurs*

Example de requête :

```
http://localhost:3000/room/1/scores
```

Paramètres :
- id : ID de la room.

Headers :
- token : Token d'authentification de l'utilisateur.

Valeur de retour : Les scores des joueurs.

```json
{
  "scores": [{userName: "test", score: 3}]
}
```

#### **POST** /room/:id/start


*Permet de lancer une partie en équipe*

Example de requête :

```
http://localhost:3000/teamroom/Team-luoja-T5/start
```

Paramètres :
- id : ID de la room.

Headers :
- token : Token d'authentification de l'utilisateur.

Valeur de retour : Confirmation du démarrage de la partie.
```json
{
    "message": "Partie démarrée avec succès"
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
  "name" : "test@luoja.fr",
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
  "name" : "test@luoja.fr",
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
    "name": "test@luoja.fr"
  }
}
```


#### **POST** /uploads


*Permet de télécharger un fichier.*



Example de requête :
```
http://localhost:3000/uploads```

Corps de la requête : Le fichier à télécharger et un ID spécifique.


```json
{
  "file": <fichier>
}
```
Valeur de retour : Le chemin du fichier téléchargé.



```json
{
  "message": "fichier enregistré avec succès",
  "filePath": "uploads/12345-1633036800000.jpg"
}
```
#### **GET**  /download/:id


*Permet de récupérer un fichier à partir d'un ID.*



Example de requête :
```
http://localhost:3000/download/12345.png
```

id : ID du fichier.


```json
{
  "file": <fichier>
}
```

Valeur de retour : Le fichier correspondant à l'ID fourni.

#### **GET**  /downloadall


*Valeur de retour : Le fichier correspondant à l'ID fourni.*



Example de requête :
```
http://localhost:3000/downloadall
```



```json
{
{
  "files": [
    {
      "fileName": "12345-1633036800000.jpg",
    },
    {
      "fileName": "12346-1633036800001.jpg",
    }
  ]
}}
```

Valeur de retour : Le fichier correspondant à l'ID fourni.



#### **delete**  /delete/:fileName


fileName : nom du fichier



Example de requête :
```
http://localhost:3000/delete/1324353253245.png
```



```json

{
    "message": "Fichier supprimé avec succès"
}
```

Valeur de retour : Le fichier correspondant à l'ID fourni.

### Route pour l'IA Luoja

#### **POST** /ai/complete

Example de requête : 
```
http://localhost:3000/ai/complete
```

Headers :
- token : Token d'authentification de l'utilisateur.

Corps de la requête : Les informations de l'utilisateur.

```json
{
  "question": "Qui est le créateur de linux ?",
  "theme": "standard",
}
```

Valeur de retour : Les réponses de l'IA.

```json
{
    "answers": [
        "Linus Torvalds",
        "Richard Stallman",
        "Andrew Tanenbaum",
        "Miles Johnston"
    ]
}
```

La première réponse est la bonne réponse.


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
-v /srv/mimir/:/usr/src/app/prisma/db/ \
-v /srv/mimir/uploads:/usr/src/app/uploads \
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
