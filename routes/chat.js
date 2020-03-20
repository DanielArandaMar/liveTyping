'use strict'
var express = require('express');
var multipart = require('connect-multiparty');
var api = express.Router();
var ChatController = require('../controllers/chat');
var md_auth = require('../middlewares/authenticated');
var md_upload = multipart({uploadDir: './uploads/chats'});

api.post('/save-chat', md_auth.ensureAuth, ChatController.saveChat);
api.get('/chat/:id', md_auth.ensureAuth, ChatController.getChat);
api.get('/chats', md_auth.ensureAuth, ChatController.getChats);
api.put('/update-chat/:id', md_auth.ensureAuth, ChatController.updateChat);
api.delete('/delete-chat/:id', md_auth.ensureAuth, ChatController.deleteChat);
api.post('/upload-image-chat/:id', [md_auth.ensureAuth, md_upload], ChatController.uploadImage);
api.get('/get-image-chat/:imageFile', ChatController.getImage);
api.post('/validate-chat-password/:id', md_auth.ensureAuth, ChatController.validateChat);

module.exports = api;