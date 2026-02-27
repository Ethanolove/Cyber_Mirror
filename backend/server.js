const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const questionsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'questions.json'), 'utf8'));

app.get('/api/questions', (req, res) => {
    res.json(questionsData);
});

app.get('/api/ollama-status', async (req, res) => {
    try {
        const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434/api/generate';
        const baseUrl = ollamaUrl.replace('/api/generate', '');
        const response = await fetch(`${baseUrl}/api/tags`);
        if (!response.ok) throw new Error();
        const data = await response.json();
        const isLoaded = data.models?.some(m => m.name.toLowerCase().startsWith('llama3.2:1b'));
        res.json({ loaded: !!isLoaded });
    } catch (e) {
        res.json({ loaded: false });
    }
});

app.post('/api/analyze', async (req, res) => {
    const userAnswers = req.body.answers;

    let totalScore = 0;
    let maxPossibleScore = 0;
    let categoryScores = {};

    questionsData.forEach(category => {
        let catScore = 0;
        let catMax = 0;

        category.questions.forEach(q => {
            const points = userAnswers[q.id] || 0;
            catScore += points;

            const maxPointsForQ = Math.max(...q.options.map(o => o.points));
            catMax += maxPointsForQ;
        });

        categoryScores[category.category] = {
            score: catScore,
            max: catMax,
            ratio: (catScore / catMax).toFixed(2)
        };

        totalScore += catScore;
        maxPossibleScore += catMax;
    });

    const worstCategories = Object.entries(categoryScores)
        .sort(([, a], [, b]) => b.ratio - a.ratio)
        .map(([name, data]) => `${name}: ${data.score}/${data.max} points`)
        .join(', ');

    const systemPrompt = `
    Je suis un expert en cybersécurité expérimenté et bienveillant, ton "Coach Cyber" personnel.
    Mon objectif est de vous donner une analyse directe et personnalisée de votre profil de risque.
    
    Adressez-vous DIRECTEMENT à l'utilisateur (le "client") en utilisant le "vous". Évitez de décrire votre propre processus analytique (évitez les phrases comme "Voici les résultats de mon analyse...").
    Donnez des conseils concrets et personnalisés pour chaque point faible.
    Soyez positif sur les points forts.
    Utilisez un formatage structuré avec des listes à puces pour que ce soit lisible sur une page web, avec des sous-titres en gras (comme **Navigation** ou **Mots de passe**).

    Voici le profil de risque calculé pour l'utilisateur (les scores sont des ratios, 0 = aucun risque, 1 = risque critique) :
    ${Object.entries(categoryScores)
      .map(([category, details]) => ` - **${category}** : ${details.ratio} (soit ${Math.round(details.ratio * 100)}%)`)
      .join('\n')}
    
    Score de Risque Global : ${totalScore} / ${maxPossibleScore} (soit ${Math.round(totalScore / maxPossibleScore * 100)}% de risque critique global).
    
    Génère un rapport d'avis structuré et direct, s'adressant à l'utilisateur.
  `;

    let aiAdvice = "L'IA est en train de réfléchir...";

    try {
        const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434/api/generate';
        console.log("Appel Ollama à :", ollamaUrl);
        
        const response = await fetch(ollamaUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "llama3.2:1b",
                prompt: systemPrompt,
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`Ollama répond avec le status ${response.status}`);
        }

        const data = await response.json();
        console.log("Données reçues d'Ollama :", data);
        aiAdvice = data.response || "L'IA n'a pas renvoyé de réponse.";

    } catch (error) {
        console.error("Erreur détaillée Ollama:", error.message);
        aiAdvice = "Impossible de contacter le Coach Cyber. L'IA est peut-être en train de démarrer ou le modèle n'est pas chargé.";
    }

    res.json({
        score: totalScore,
        maxScore: maxPossibleScore,
        details: categoryScores,
        advice: aiAdvice
    });
});

const PORT = 8000;
app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
});