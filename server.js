const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv/config');
const cors = require('cors')
const app = express()
const cookieParser = require("cookie-parser")

mongoose.set('strictQuery', false);
mongoose.connect(process.env.DB_CONNECTION, () => console.log('connected to DB!'))

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


app.listen(9999, () => {
    console.log('Server up at 9999')
})

