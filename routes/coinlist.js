const express = require('express');
const router = express.Router();
const Coinlist = require('../model/Coinlist');
const { validateCookie } = require('./auth');

// ── POST /coinlist ────────────────────────────────────
router.post('/', validateCookie, async (req, res) => {
    const { name, price, id } = req.body;

    if (!name || !id) {
        return res.status(400).json({ status: 'error', error: 'name and id are required' });
    }

    try {
        // Prevent duplicates
        const existing = await Coinlist.findOne({ id, UserID: res.locals.userid });
        if (existing) return res.status(409).json({ status: 'error', error: 'Coin already in watchlist' });

        const coin = await Coinlist.create({
            name,
            price: String(price || '0'),
            id,
            UserID: res.locals.userid,
        });

        return res.status(201).json({ status: 'ok', data: coin });
    } catch (err) {
        console.error('Add coin error:', err);
        return res.status(500).json({ status: 'error', error: 'Server error' });
    }
});

// ── GET /coinlist ─────────────────────────────────────
router.get('/', validateCookie, async (req, res) => {
    try {
        const coins = await Coinlist.find({ UserID: res.locals.userid });
        return res.json(coins);
    } catch (err) {
        console.error('Get coinlist error:', err);
        return res.status(500).json({ status: 'error', error: 'Server error' });
    }
});

// ── DELETE /coinlist/:coinId ──────────────────────────
router.delete('/:coinId', validateCookie, async (req, res) => {
    try {
        const coin = await Coinlist.findById(req.params.coinId);
        if (!coin) return res.status(404).json({ status: 'error', error: 'Coin not found' });

        // Compare as strings to avoid ObjectId type mismatch
        if (coin.UserID.toString() !== res.locals.userid.toString()) {
            return res.status(403).json({ status: 'error', error: 'Not authorized' });
        }

        await Coinlist.deleteOne({ _id: req.params.coinId });
        return res.json({ status: 'ok', message: 'Coin removed' });
    } catch (err) {
        console.error('Delete coin error:', err);
        return res.status(500).json({ status: 'error', error: 'Server error' });
    }
});

module.exports = router;