# Règles de contribution au projet

## Règles de développement JavaScript

### 1. **Commentaires**
- Les commentaires doivent être rédigés en **français**.
- Les commentaires doivent être clairs, concis et pertinents (maximum une phrase).

### 2. **Nommage des variables**
- Les noms de variables doivent être rédigés en **anglais**.
- Utilisez un style **camelCase** pour nommer les variables (par exemple, `userCookie`, `currentQuiz`).

### 3. **Nommage des fonctions**
- Les fonctions doivent être nommées en **anglais**.
- Utilisez un style **camelCase** pour les fonctions également (par exemple, `calculeScore`, `handleQuizResponse`).
- Les noms de fonctions doivent être explicites et décrire leur action ou leur objectif de manière claire.

### 4. **Linting**
- Le code doit être automatiquement vérifié et formaté avec **ESLint** pour assurer la qualité et la cohérence du code.
- Un fichier de configuration ESLint doit être présent dans le projet et utilisé systématiquement.

---

## Règles de gestion du Git

### 1. **Nom des branches**
- Les branches doivent être nommées en **français** et en **minuscules**, selon le format suivant :  
  `<type> - <nom de la branche>`.

- **Types de branches** :  
  - `add` : Ajout de nouvelles fonctionnalités ou de fichiers.  
  - `remove` : Suppression de code ou de fichiers.  
  - `update` : Mise à jour ou amélioration de code ou d’une fonctionnalité.  

- **Exemples** :  
  - `add-formulaire-contact`  
  - `remove-typo`  
  - `update-configuration-serveur`

### 2. **Message de commit**
- Le message de commit doit être rédigé en **français**, et suivre le format :  
  `<type> - <description>`.

- **Types de commit** :  
  - `add` : Ajout de nouvelles fonctionnalités ou de fichiers.  
  - `remove` : Suppression de code ou de fichiers.  
  - `update` : Mise à jour ou amélioration de code ou d’une fonctionnalité.  
  
- **Exemples** :  
  - `add - ajout du formulaire de contact`  
  - `fix - correction du bug d'affichage du bouton`  
  - `update - mise à jour du fichier README`  


---

## Règles de gestion des Issues

### 1. **Création d'issues**
- Une **issue** doit être créée pour chaque nouvelle fonctionnalité, bug, ou amélioration.
- Chaque **issue** doit être clairement décrite, avec des détails sur le comportement attendu et les étapes pour reproduire le problème (si applicable).

### 2. **Branches et Merge Requests**
- Pour chaque **issue**, une **branche** spécifique doit être créée.
- Une **merge request** doit être ouverte lorsque le développement est terminé, pour réviser et fusionner la branche avec la branche principale (`main` ou `dev`).
- L'issue doit être liée à la merge request correspondante et fermée une fois la fusion effectuée.