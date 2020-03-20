'use strict'
var express = require('express');
var api = express.Router();
var MessageController = require('../controllers/message');
var md_ensure = require('../middlewares/authenticated');

api.post('/save-message', md_ensure.ensureAuth, MessageController.saveMessage);
api.get('/messages-chat/:chatId', md_ensure.ensureAuth, MessageController.getMessages);
api.get('/messages-chat-user/:chatId', md_ensure.ensureAuth, MessageController.getMessagesByUser);


module.exports = api;