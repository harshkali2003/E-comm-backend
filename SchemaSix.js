const mongoose = require('mongoose')

let paymentModel = new mongoose.Schema({
    price: Number,
    currency: String,
    receipt: String,
    paymentId: String,
    orderId: String,
    signature: String,
    status: String,
})

module.exports = mongoose.model('Payment' , paymentModel)