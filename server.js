const express = require('express');
const OpenAI = require('openai');
const path = require('path');
const bodyParser = require('body-parser');
const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv/config');
const cors = require('cors')
const app = express()
const cookieParser = require("cookie-parser")
const port = 9999;

mongoose.set('strictQuery', false);
mongoose.connect(process.env.DB_CONNECTION, () => console.log('connected to DB!'))

const uri = process.env.DB_CONNECTION;

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const connection = mongoose.connection;
connection.once('open', () => {
    console.log('MongoDB database connection established successfully');
});


app.use(cors({ credentials: true, origin: process.env.REACT_APP_CORS_LINK }));
app.use('/', express.static(path.join(__dirname, 'static')))
app.use(bodyParser.json())
app.use(
    express.urlencoded({
        extended: true,
    })
);
app.use(cookieParser());

const coinlistRoute = require('./routes/coinlist');
const authRoute = require('./routes/auth');
const stocklistRoute = require('./routes/stocklist');
const openai = new OpenAI({ key: process.env.OPENAI_API_KEY });

app.use('/coinlist', coinlistRoute)
app.use('/user', authRoute);
app.use('/stocklist', stocklistRoute)

app.use(express.json());

app.post('/api/chat', async (req, res) => {
    const { userMessage } = req.body;

    try {
        const completion = await openai.chat.completions.create({
            messages: [{ role: 'system', content: 'You are a helpful assistant.' }, { role: 'user', content: userMessage }],
            model: 'gpt-3.5-turbo',
        });

        const botMessage = completion.choices[0].message.content;

        res.json({ botMessage });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});