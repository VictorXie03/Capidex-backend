const express = require('express');
const router = express.Router();
const yahooFinance = require('yahoo-finance2').default;

const CG_HEADERS = process.env.COINGECKO_KEY
    ? { 'x-cg-demo-api-key': process.env.COINGECKO_KEY }
    : {};

const axios = require('axios');

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

function parsePrices(prices) {
    return prices.map(([timestamp, p]) => ({
        Date: new Date(timestamp).toLocaleDateString('en-us'),
        Price: p,
    }));
}

// ── GET /market/stocks/trending ───────────────────────
router.get('/stocks/trending', async (req, res) => {
    const cacheKey = 'stocks_trending';
    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);

    const symbols = ['TSLA', 'AAPL', 'GOOGL', 'AMZN', 'META'];

    try {
        const results = await Promise.all(
            symbols.map(s => yahooFinance.quote(s))
        );

        const stocks = results.map(q => ({
            symbol: q.symbol,
            name: q.longName || q.shortName,
            price: q.regularMarketPrice?.toFixed(2),
            change: q.regularMarketChange?.toFixed(2),
            changePercent: q.regularMarketChangePercent?.toFixed(2),
            high: q.regularMarketDayHigh?.toFixed(2),
            low: q.regularMarketDayLow?.toFixed(2),
            volume: q.regularMarketVolume,
            marketCap: q.marketCap,
        }));

        setCache(cacheKey, stocks);
        return res.json(stocks);
    } catch (err) {
        console.error('Trending stocks error:', err.message);
        return res.status(500).json({ error: 'Failed to fetch stocks' });
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
        const results = await yahooFinance.search(q);
        const stocks = (results.quotes || [])
            .filter(r => r.quoteType === 'EQUITY' || r.quoteType === 'ETF')
            .slice(0, 10)
            .map(r => ({
                symbol: r.symbol,
                name: r.longname || r.shortname,
            }));

        setCache(cacheKey, stocks);
        return res.json(stocks);
    } catch (err) {
        console.error('Stock search error:', err.message);
        return res.json([]);
    }
});

// ── GET /market/stocks/:symbol ────────────────────────
// Full stock detail with chart data
router.get('/stocks/:symbol', async (req, res) => {
    const { symbol } = req.params;
    const cacheKey = `stock_detail_${symbol}`;
    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);

    try {
        const now = new Date();
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(now.getFullYear() - 1);

        const [quote, history] = await Promise.all([
            yahooFinance.quote(symbol),
            yahooFinance.historical(symbol, {
                period1: oneYearAgo.toISOString().split('T')[0],
                period2: now.toISOString().split('T')[0],
                interval: '1d',
            }),
        ]);

        const graphData = history.map(d => ({
            Date: new Date(d.date).toLocaleDateString('en-us'),
            Price: d.close,
        }));

        const result = {
            symbol: quote.symbol,
            name: quote.longName || quote.shortName,
            price: quote.regularMarketPrice?.toFixed(2),
            change: quote.regularMarketChange?.toFixed(2),
            changePercent: quote.regularMarketChangePercent?.toFixed(2),
            high52: quote.fiftyTwoWeekHigh?.toFixed(2),
            low52: quote.fiftyTwoWeekLow?.toFixed(2),
            high24: quote.regularMarketDayHigh?.toFixed(2),
            low24: quote.regularMarketDayLow?.toFixed(2),
            volume: quote.regularMarketVolume,
            marketCap: quote.marketCap,
            pe: quote.trailingPE?.toFixed(2),
            eps: quote.epsTrailingTwelveMonths?.toFixed(2),
            graphData,
        };

        setCache(cacheKey, result);
        return res.json(result);
    } catch (err) {
        console.error(`Stock detail error for ${symbol}:`, err.message);
        return res.status(500).json({ error: 'Failed to fetch stock data' });
    }
});

// ── GET /market/crypto/trending ───────────────────────
router.get('/crypto/trending', async (req, res) => {
    const cacheKey = 'crypto_trending';
    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);

    try {
        const [trendingRes, btcRes] = await Promise.all([
            axios.get('https://api.coingecko.com/api/v3/search/trending', { headers: CG_HEADERS }),
            axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd', { headers: CG_HEADERS }),
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
        console.error('Trending crypto error:', err.message);
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
        const response = await axios.get(
            `https://api.coingecko.com/api/v3/search?query=${q}`,
            { headers: CG_HEADERS }
        );
        const coins = response.data.coins.map(coin => ({
            id: coin.id,
            name: coin.name,
            image: coin.large,
        }));
        setCache(cacheKey, coins);
        return res.json(coins);
    } catch (err) {
        console.error('Crypto search error:', err.message);
        return res.json([]);
    }
});

// ── GET /market/crypto/:id ────────────────────────────
router.get('/crypto/:id', async (req, res) => {
    const { id } = req.params;
    const cacheKey = `crypto_detail_${id}`;
    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);

    try {
        const [dataRes, chartDefault, chartDay, chartWeek, chartYear] = await Promise.all([
            axios.get(`https://api.coingecko.com/api/v3/coins/${id}?localization=false&market_data=true`, { headers: CG_HEADERS }),
            axios.get(`https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=121`, { headers: CG_HEADERS }),
            axios.get(`https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=1`, { headers: CG_HEADERS }),
            axios.get(`https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=7`, { headers: CG_HEADERS }),
            axios.get(`https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=365`, { headers: CG_HEADERS }),
        ]);

        const result = {
            data: dataRes.data,
            graphData: parsePrices(chartDefault.data.prices),
            graphDataDay: parsePrices(chartDay.data.prices),
            graphDataWeek: parsePrices(chartWeek.data.prices),
            graphDataYear: parsePrices(chartYear.data.prices),
        };

        setCache(cacheKey, result);
        return res.json(result);
    } catch (err) {
        console.error(`Coin detail error for ${id}:`, err.message);
        return res.status(500).json({ error: 'Failed to fetch coin data' });
    }
});

module.exports = router;