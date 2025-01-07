const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const personalSchema= new Schema({
    task: String,
})

module.exports = mongoose.model('Personal',personalSchema);