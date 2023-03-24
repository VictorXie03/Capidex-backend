const express = require('express');
const router = express.Router();
const Coinlist = require("../model/Coinlist");
const { validateCookie } = require('./auth')

router.post('/', validateCookie, async (req, res) => {

    try {
        const response = await Coinlist.create({
            name: req.body.name,
            price: req.body.price,
            id: req.body.id,
            UserID: res.locals.userid
        })
        console.log('added coin', response)
    } catch (err) {
        res.json({ message: err })
    }

})
router.get('/', validateCookie, async (req, res) => {

    try {
        const coinlists = await Coinlist.find({ UserID: res.locals.userid });
        res.json(coinlists);
    } catch (err) {
        res.json({ msg: err });
    }
})

router.delete('/:coinId', validateCookie, async (req, res) => {
    try {
        const tarCoin = await Coinlist.findOne({ _id: req.params.coinId });

        if (tarCoin.UserID !== res.locals.userid) return res.status(403).json('Not Authenticated')

        const removedCoin = await Coinlist.deleteOne({ _id: req.params.coinId });

        res.json(removedCoin)

    } catch (err) {
        res.json({ msg: err });
    }
})

module.exports = router;