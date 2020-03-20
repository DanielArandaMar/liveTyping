'use strict'
var express = require('express');
var multipart = require('connect-multiparty');
var api = express.Router();
var UserController = require('../controllers/user');
var md_auth = require('../middlewares/authenticated');
var md_upload = multipart({uploadDir: './uploads/users'});

api.post('/save-user', UserController.saveUser);
api.post('/login', UserController.logIn);
api.put('/update-user', md_auth.ensureAuth, UserController.updateUser);
api.get('/users', md_auth.ensureAuth, UserController.getUsers);
api.post('/upload-image-user', [md_auth.ensureAuth, md_upload], UserController.uploadImage)
api.get('/get-image-user/:imageFile', UserController.getImageUser);
api.put('/update-user-activeChat/:chatId', md_auth.ensureAuth, UserController.updateActiveChat);
api.get('/get-counters-user/:chatId', md_auth.ensureAuth, UserController.getCounters);
api.get('/my-user', md_auth.ensureAuth, UserController.getMyUser);
api.put('/update-user-status', md_auth.ensureAuth, UserController.updateUserStatus);

module.exports = api;
