const router = require('express').Router();
const User = require('../model/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ── Middleware: validate JWT cookie ──────────────────
async function validateCookie(req, res, next) {
    const token = req.cookies?.token;
    if (!token) return res.status(403).json({ status: 'error', error: 'Not authenticated' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        res.locals.userid = decoded.id;
        const user = await User.findById(decoded.id).lean();
        if (!user) return res.status(403).json({ status: 'error', error: 'User not found' });
        res.locals.username = user.username;
        next();
    } catch (err) {
        return res.status(403).json({ status: 'error', error: 'Invalid token' });
    }
}

// ── Cookie options ────────────────────────────────────
const isProd = process.env.NODE_ENV === 'production';
const cookieOptions = {
    httpOnly: true,
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd,
    maxAge: 7 * 24 * 60 * 60 * 1000,
};

// ── POST /user/login ──────────────────────────────────
router.post('/login', async (req, res) => {
    const existingToken = req.cookies?.token;
    if (existingToken) {
        try {
            const decoded = jwt.verify(existingToken, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).lean();
            if (user) return res.status(200).json({ status: 'ok', user: { username: user.username } });
        } catch {
            // token invalid, fall through to normal login
        }
    }

    const { username, password } = req.body || {};

    if (!username || !password) {
        return res.status(400).json({ status: 'error', error: 'Username and password required' });
    }

    const user = await User.findOne({ username }).lean();
    if (!user) return res.status(401).json({ status: 'error', error: 'Invalid username or password' });

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return res.status(401).json({ status: 'error', error: 'Invalid username or password' });

    const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, cookieOptions);
    return res.status(200).json({ status: 'ok', user: { username: user.username } });
});

// ── POST /user/register ───────────────────────────────
router.post('/register', async (req, res) => {
    const { username, password } = req.body || {};

    if (!username || typeof username !== 'string') {
        return res.status(400).json({ status: 'error', error: 'Invalid username' });
    }
    if (!password || typeof password !== 'string') {
        return res.status(400).json({ status: 'error', error: 'Invalid password' });
    }
    if (password.length < 5) {
        return res.status(400).json({ status: 'error', error: 'Password must be at least 5 characters' });
    }

    const hashed = await bcrypt.hash(password, 10);

    try {
        await User.create({ username, password: hashed });
        return res.status(201).json({ status: 'ok', message: 'Account created. Please log in.' });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ status: 'error', error: 'Username already taken' });
        }
        console.error('Register error:', err);
        return res.status(500).json({ status: 'error', error: 'Server error' });
    }
});

// ── GET /user/logout ──────────────────────────────────
router.get('/logout', (req, res) => {
    res.cookie('token', '', { ...cookieOptions, maxAge: 0 });
    res.json({ status: 'ok', msg: 'Logged out' });
});

module.exports = router;
module.exports.validateCookie = validateCookie;