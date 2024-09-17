const mongoose = require('mongoose')

const Subscribe = new mongoose.Schema({
    email:{
        type:String,
        unique:true,
        required:true
    }
})

module.exports = mongoose.model('Subscribers' , Subscribe)