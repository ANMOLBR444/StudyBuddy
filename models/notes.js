const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const notesSchema= new Schema({
    semester: Number,
    subject: String,
    topic: String,
    fileurl: String
})

module.exports = mongoose.model('Note',notesSchema);