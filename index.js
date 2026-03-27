const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors()); // Autorise ton front-end à appeler ce serveur
app.use(express.json());

/**
 * ROUTE 1 : WEB CONTENT SCRAPER
 * Extrait le texte brut et nettoyé d'une page
 */
app.post('/extract-text', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: "L'URL est requise" });
    }

    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'fr-FR,fr;q=0.9'
            },
            timeout: 10000 
        });

        const $ = cheerio.load(response.data);

        // Nettoyage du HTML pour ne garder que le texte utile
        $('script, style, nav, footer, header, noscript, iframe').remove();

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
            error: "Erreur lors de l'extraction du texte", 
            details: error.message 
        });
    }
});

/**
 * ROUTE 2 : HTTP & META ANALYZER
 * Vérifie le statut HTTP et extrait les balises SEO
 */
app.post('/check-meta', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: "L'URL est requise" });
    }

    try {
        // validateStatus: false permet de récupérer la réponse même si c'est une erreur 404 ou 500
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
                'Accept-Language': 'fr-FR,fr;q=0.9'
            },
            timeout: 10000,
            validateStatus: false 
        });

        const $ = cheerio.load(response.data);

        // Extraction précise des balises SEO
        const metaData = {
            status: response.status,
            canonical: $('link[rel="canonical"]').attr('href') || "Aucune balise canonique trouvée",
            title: $('title').text().trim() || "Aucun titre trouvé",
            h1: $('h1').first().text().trim() || "Aucun H1 trouvé",
            description: $('meta[name="description"]').attr('content') || "Aucune meta description trouvée"
        };

        res.json(metaData);

    } catch (error) {
        res.status(500).json({ 
            error: "Erreur lors de l'analyse Meta", 
            details: error.message 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur GEO multi-outils actif sur le port ${PORT}`));
