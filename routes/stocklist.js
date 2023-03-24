const express = require('express');
const router = express.Router();
const Stocklist = require("../model/Stocklist");
const { validateCookie } = require('./auth')
const axios = require('axios');

router.post('/', validateCookie, async (req, res) => {
    const { name, symbol } = req.body;

    try {
        const response = await axios.get(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=QD5VF4J0PRZS8TED`);
        console.log(response.data)
        const price = response.data["Global Quote"]["05. price"];
        console.log(price)
        const stock = await Stocklist.create({
            name,
            symbol,
            UserID: res.locals.userid,
            price,
        });

        console.log('added stock', stock);

        res.json(stock);

    } catch (err) {
        res.json({ message: "s" });
    }
});


router.get('/', validateCookie, async (req, res) => {

    try {
        const stocklists = await Stocklist.find({ UserID: res.locals.userid });
        res.json(stocklists);
    } catch (err) {
        res.json({ msg: err });
    }
})

router.delete('/:stockId', validateCookie, async (req, res) => {
    try {
        const tarStock = await Stocklist.findOne({ _id: req.params.stockId });

        if (tarStock.UserID !== res.locals.userid) return res.status(403).json('Not Authenticated')

        const removedStock = await Stocklist.deleteOne({ _id: req.params.stockId });

        res.json(removedStock)

    } catch (err) {
        res.json({ msg: err });
    }
})

module.exports = router;