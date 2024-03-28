const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv/config');
const cors = require('cors')
const app = express()
const cookieParser = require("cookie-parser")
const port = process.env.PORT || 4000;

mongoose.set('strictQuery', false);
mongoose.connect(process.env.DB_CONNECTION, () => { console.log('connected to DB!') })
    .catch((err) => {
        console.error(err)
    })
app.get('/test-cors', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://example.com');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.send('CORS headers set correctly');
});

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'https://capidex.netlify.app/');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, access-control-allow-methods, access-control-allow-origin, access-control-allow-credentials, access-control-allow-headers');
    next();
});
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

app.use('/coinlist', coinlistRoute)
app.use('/user', authRoute);
app.use('/stocklist', stocklistRoute)

app.use(express.json());

app.listen(port, () => {
    console.log(`Server is running on ${port}`);
});