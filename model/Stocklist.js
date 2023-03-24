const mongoose = require('mongoose');


const StocklistSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    symbol: {
        type: String,
        required: true
    },
    UserID: {
        type: String,
        required: true
    },
    price: {
        type: String,
        required: true
    }
}, { collection: 'stocklist' });


module.exports = mongoose.model('Stocklist', StocklistSchema);