'use strict'
var moongose = require('mongoose');
var Schema = moongose.Schema;

var UserSchema = Schema({
    name: String,
    nick: String,
    email: String,
    password: String,
    role: String,
    image: String,
    incognit: Boolean,
    status: Boolean,
    activeChat: String,
    created_at: String
});

module.exports = moongose.model('User', UserSchema);