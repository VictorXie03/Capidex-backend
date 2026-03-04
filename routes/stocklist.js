const express = require('express');
const router = express.Router();
const Stocklist = require('../model/Stocklist');
const { validateCookie } = require('./auth');
const axios = require('axios');

// ── POST /stocklist ───────────────────────────────────
router.post('/', validateCookie, async (req, res) => {
    const { name, symbol, price } = req.body;

    if (!symbol) return res.status(400).json({ status: 'error', error: 'symbol is required' });

    try {
        // Prevent duplicates
        const existing = await Stocklist.findOne({ symbol, UserID: res.locals.userid });
        if (existing) return res.status(409).json({ status: 'error', error: 'Stock already in watchlist' });

        // Use price passed from frontend if available, otherwise fetch it
        let stockPrice = price;
        if (!stockPrice) {
            const response = await axios.get(
                `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${process.env.ALPHA_VANTAGE_KEY || 'QD5VF4J0PRZS8TED'}`
            );
            stockPrice = response.data?.['Global Quote']?.['05. price'] || '0';
        }

        const stock = await Stocklist.create({
            name: name || symbol,
            symbol,
            UserID: res.locals.userid,
            price: String(stockPrice),
        });

        return res.status(201).json({ status: 'ok', data: stock });
    } catch (err) {
        console.error('Add stock error:', err);
        return res.status(500).json({ status: 'error', error: 'Server error' });
    }
});

// ── GET /stocklist ────────────────────────────────────
router.get('/', validateCookie, async (req, res) => {
    try {
        const stocks = await Stocklist.find({ UserID: res.locals.userid });
        return res.json(stocks);
    } catch (err) {
        console.error('Get stocklist error:', err);
        return res.status(500).json({ status: 'error', error: 'Server error' });
    }
});

// ── DELETE /stocklist/:stockId ────────────────────────
router.delete('/:stockId', validateCookie, async (req, res) => {
    try {
        const stock = await Stocklist.findById(req.params.stockId);
        if (!stock) return res.status(404).json({ status: 'error', error: 'Stock not found' });

        // Compare as strings to avoid ObjectId type mismatch
        if (stock.UserID.toString() !== res.locals.userid.toString()) {
            return res.status(403).json({ status: 'error', error: 'Not authorized' });
        }

        await Stocklist.deleteOne({ _id: req.params.stockId });
        return res.json({ status: 'ok', message: 'Stock removed' });
    } catch (err) {
        console.error('Delete stock error:', err);
        return res.status(500).json({ status: 'error', error: 'Server error' });
    }
});

module.exports = router;