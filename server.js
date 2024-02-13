const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv/config');
const cors = require('cors')
const app = express()
const cookieParser = require("cookie-parser")
const port = 9999;

mongoose.set('strictQuery', false);
mongoose.connect(process.env.DB_CONNECTION, () => console.log('connected to DB!'))

const uri = process.env.DB_CONNECTION;

mongoose.connect(process.env.DB_CONNECTION, { useNewUrlParser: true, useUnifiedTopology: true });

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

app.use('/coinlist', coinlistRoute)
app.use('/user', authRoute);
app.use('/stocklist', stocklistRoute)

app.use(express.json());

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});