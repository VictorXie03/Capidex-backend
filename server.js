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
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', process.env.REACT_APP_CORS_LINK);
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
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