'use strict'
var moongose = require('mongoose');
var Schema = moongose.Schema;

var MessageSchema = Schema({
    user: { type: Schema.ObjectId, ref: 'User' },
    chat: { type: Schema.ObjectId, ref: 'Chat' },
    text: String,
    created_at: String
});

module.exports = moongose.model('Message', MessageSchema);