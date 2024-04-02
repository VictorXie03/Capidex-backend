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
mongoose.connection.on('connected', () => console.log('connected'));
mongoose.connection.on('open', () => console.log('open'));
mongoose.connection.on('disconnected', () => console.log('disconnected'));
mongoose.connection.on('reconnected', () => console.log('reconnected'));
mongoose.connection.on('disconnecting', () => console.log('disconnecting'));
mongoose.connection.on('close', () => console.log('close'));
mongoose.connect(process.env.DB_CONNECTION, { useNewUrlParser: true }, () => { console.log('connected to DB!') })
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
    console.log(`Server is running on ${port}`);
});