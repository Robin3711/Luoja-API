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
    "correct": false
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

### **POST** /user/register : Permet d'enregistrer un nouvel utilisateur.

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

### **POST** /user/login : Permet de connecter un utilisateur.

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

### **GET** /user/infos : Permet de récupérer les informations de l'utilisateur.

Example de requête : 
```
http://localhost:3000/user/infos
```

Headers :
- token : Token d'authentification de l'utilisateur

Valeur de retour : Les informations de l'utilisateur.

```json
A déterminer 
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
docker.luoja.fr/mimir    
```

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


