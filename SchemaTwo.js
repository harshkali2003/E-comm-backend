const mongoose = require('mongoose')

let AddProduct = new mongoose.Schema({
    name:String,
    desc:String,
    cat:String,
    price:String
})

module.exports = mongoose.model('Products' , AddProduct)