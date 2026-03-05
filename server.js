const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv/config');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();
const port = process.env.PORT || 4000;

// ── Database ──────────────────────────────────────────
mongoose.set('strictQuery', false);
mongoose.connection.on('connected', () => console.log('[DB] connected'));
mongoose.connection.on('error', (err) => console.error('[DB] error:', err));

mongoose.connect(process.env.DB_CONNECTION, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).catch(err => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
});

// ── Middleware ────────────────────────────────────────
app.use(cors({ credentials: true, origin: process.env.REACT_APP_CORS_LINK }));
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Routes ────────────────────────────────────────────
app.use('/coinlist', require('./routes/coinlist'));
app.use('/user', require('./routes/auth'));
app.use('/stocklist', require('./routes/stocklist'));
app.use('/market', require('./routes/market'));   // new proxy route

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(port, () => console.log(`Server running on port ${port}`));