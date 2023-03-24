const mongoose = require('mongoose');


const CoinlistSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    price: {
        type: String,
        required: true
    },
    UserID: {
        type: String,
        required: true
    },
    id: {
        type: String,
        required: true
    }
}, { collection: 'coinlist' });


module.exports = mongoose.model('Coinlist', CoinlistSchema);