const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors()); // Autorise ton front-end à appeler ce serveur
app.use(express.json());

app.post('/extract-text', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: "L'URL est requise" });
    }

    try {
        // 1. Récupération du HTML avec un User-Agent de navigateur récent
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'fr-FR,fr;q=0.9'
            },
            timeout: 10000 // Évite que la fonction ne tourne dans le vide
        });

        // 2. Chargement dans Cheerio
        const $ = cheerio.load(response.data);

        // 3. Nettoyage : on supprime ce qui n'est pas du contenu textuel
        $('script, style, nav, footer, header, noscript, iframe').remove();

        // 4. Extraction du texte du body
        // .replace permet de nettoyer les espaces doubles et retours à la ligne inutiles
        const cleanText = $('body')
            .text()
            .replace(/\s+/g, ' ')
            .trim();

        res.json({ 
            url: url,
            content: cleanText,
            length: cleanText.length 
        });

    } catch (error) {
        res.status(500).json({ 
            error: "Erreur lors de l'extraction", 
            details: error.message 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur GEO actif sur le port ${PORT}`));