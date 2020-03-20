'use strict'
var moongose = require('mongoose');
var Schema = moongose.Schema;

var ChatSchema = Schema({
   name: String,
   capacity: Number,
   image: String,
   description: String,
   password: String,
   created_at: String
});

module.exports = moongose.model('Chat', ChatSchema);