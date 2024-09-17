const mongoose = require('mongoose')

let Feedback = new mongoose.Schema({
    name:String,
    email:String,
    desc:String
})

module.exports = mongoose.model('New' , Feedback)