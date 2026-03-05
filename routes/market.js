const express = require('express');
const router = express.Router();
const axios = require('axios');

const ALPHA_KEY = process.env.ALPHA_VANTAGE_KEY;

// ── Simple in-memory cache ────────────────────────────
const cache = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCache(key) {
    const entry = cache[key];
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL) {
        delete cache[key];
        return null;
    }
    return entry.data;
}

function setCache(key, data) {
    cache[key] = { data, timestamp: Date.now() };
}

// ── GET /market/stocks/trending ───────────────────────
// Returns top 5 stocks with prices, cached for 5 mins
router.get('/stocks/trending', async (req, res) => {
    const cacheKey = 'stocks_trending';
    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);

    const symbols = ['TSLA', 'AAPL', 'GOOGL', 'AMZN', 'META'];
    const names = {
        TSLA: 'Tesla Inc',
        AAPL: 'Apple Inc',
        GOOGL: 'Alphabet Inc',
        AMZN: 'Amazon.com Inc',
        META: 'Meta Platforms Inc',
    };

    try {
        const responses = await Promise.all(
            symbols.map(s =>
                axios.get(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${s}&apikey=${ALPHA_KEY}`)
            )
        );

        const stocks = responses.map((res, i) => {
            const quote = res.data?.['Global Quote'];
            if (!quote || !quote['01. symbol']) {
                return { symbol: symbols[i], name: names[symbols[i]], price: null };
            }
            return {
                symbol: quote['01. symbol'],
                name: names[symbols[i]],
                price: quote['05. price'],
                change: quote['09. change'],
                changePercent: quote['10. change percent'],
            };
        });

        setCache(cacheKey, stocks);
        return res.json(stocks);
    } catch (err) {
        console.error('Trending stocks error:', err);
        // Return fallback with no prices rather than crashing
        const fallback = symbols.map(s => ({ symbol: s, name: names[s], price: null }));
        return res.json(fallback);
    }
});

// ── GET /market/stocks/search?q=QUERY ─────────────────
router.get('/stocks/search', async (req, res) => {
    const { q } = req.query;
    if (!q || q.length < 1) return res.json([]);

    const cacheKey = `stocks_search_${q.toLowerCase()}`;
    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);

    try {
        const response = await axios.get(
            `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${q}&apikey=${ALPHA_KEY}`
        );

        if (!response.data?.bestMatches) return res.json([]);

        const stocks = response.data.bestMatches.map(m => ({
            symbol: m['1. symbol'],
            name: m['2. name'],
        }));

        setCache(cacheKey, stocks);
        return res.json(stocks);
    } catch (err) {
        console.error('Stock search error:', err);
        return res.json([]);
    }
});

// ── GET /market/crypto/trending ───────────────────────
router.get('/crypto/trending', async (req, res) => {
    const cacheKey = 'crypto_trending';
    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);

    try {
        const [trendingRes, btcRes] = await Promise.all([
            axios.get('https://api.coingecko.com/api/v3/search/trending'),
            axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'),
        ]);

        const btcPrice = btcRes.data.bitcoin.usd;
        const coins = trendingRes.data.coins.map(coin => ({
            id: coin.item.id,
            name: coin.item.name,
            image: coin.item.large,
            priceBtc: coin.item.price_btc?.toFixed(10),
            priceUsd: (coin.item.price_btc * btcPrice)?.toFixed(4),
        }));

        setCache(cacheKey, coins);
        return res.json(coins);
    } catch (err) {
        console.error('Trending crypto error:', err);
        return res.json([]);
    }
});

// ── GET /market/crypto/search?q=QUERY ────────────────
router.get('/crypto/search', async (req, res) => {
    const { q } = req.query;
    if (!q || q.length < 1) return res.json([]);

    const cacheKey = `crypto_search_${q.toLowerCase()}`;
    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);

    try {
        const res2 = await axios.get(
            `https://api.coingecko.com/api/v3/search?query=${q}`
        );
        const coins = res2.data.coins.map(coin => ({
            id: coin.id,
            name: coin.name,
            image: coin.large,
        }));

        setCache(cacheKey, coins);
        return res.json(coins);
    } catch (err) {
        console.error('Crypto search error:', err);
        return res.json([]);
    }
});

module.exports = router;