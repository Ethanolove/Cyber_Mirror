# 🛡️ Cyber Mirror - Audit de Sécurité par IA

**Cyber Mirror** est une application web interactive conçue pour sensibiliser les utilisateurs aux enjeux de la cybersécurité et du RGPD. Grâce à une intelligence artificielle locale (Ollama), l'application analyse vos habitudes numériques et génère un profil de risque personnalisé sous forme de graphique radar et de conseils pédagogiques.

---

## Installation et Déploiement (Docker)

Le projet est entièrement conteneurisé. Une seule commande permet de lancer le Frontend, le Backend et le moteur d'IA.

### Pré-requis
- Docker et Docker Compose installés.

### Lancement
1. Clonez le dépôt.
2. Lancez l'infrastructure :
   ```bash
   docker-compose up -d
   ```
3. Accédez à l'application : http://localhost:3000 (Frontend) et http://localhost:8000 (Backend API).

### Chargement du modèle IA (Ollama)
Le projet est configuré pour télécharger automatiquement le modèle **Llama 3.2:1b** (1.3 Go) au premier démarrage via un service dédié. Une barre d'état en bas de l'application indique si l'IA est prête.

**Pour charger ou vérifier le modèle manuellement via le terminal :**
```bash
docker exec -it projet-ollama-1 ollama pull llama3.2:1b
```

---

## Architecture Technique

- **Frontend** : Vue.js 3 + Tailwind CSS. Utilisation de `vue-chartjs` pour la visualisation radar.
- **Backend** : Node.js (Express). Contient le moteur de règles déterministe pour le calcul des scores (Explicabilité).
- **IA** : Ollama (Modèle Llama 3.2 1b). Le prompt système force l'IA à agir comme un "Coach Cyber" pédagogique.

---

## Conformité RGPD & Éthique

Le projet respecte les directives du sujet concernant la protection des données :
- **Privacy by Design** : Absence totale de base de données. Les réponses sont traitées en mémoire vive puis oubliées dès le rafraîchissement de la page.
- **Anonymisation** : Les données envoyées à l'IA sont uniquement des scores numériques et des catégories de risques, sans lien avec une identité réelle.
- **Local First** : Aucun appel vers des API Cloud (OpenAI/Google). L'intégralité du traitement IA reste sur la machine de l'utilisateur.

---

## Barème de Scoring (Moteur de Règles)

Le calcul du score respecte la pondération officielle :
- **Mots de passe** : 40%
- **Navigation Web** : 30%
- **Emails / Phishing** : 20%
- **Réseaux Sociaux** : 10%

Le graphique radar affiche les ratios de vulnérabilité par thématique pour une compréhension immédiate des failles.
