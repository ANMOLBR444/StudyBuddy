const mongoose = require('mongoose');
const passportlocalmongoose = require('passport-local-mongoose');
const personal = require('./personal');
const Schema = mongoose.Schema;

const UserSchema= new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    personaltodos: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Personal'
        }
    ]
})
UserSchema.plugin(passportlocalmongoose);
module.exports = mongoose.model('User',UserSchema);