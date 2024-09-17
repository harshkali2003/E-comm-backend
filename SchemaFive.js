const mongoose = require('mongoose')

const ContactUser = new mongoose.Schema({
    name : String,
    email: String,
    message : String
})

module.exports = mongoose.model('Question' , ContactUser)