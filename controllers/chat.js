'use strict'
var Chat = require('../models/chat');
var Message = require('../models/message');
var fs = require('fs');
var path = require('path');
var bcrypt = require('bcrypt-nodejs');

var controller = {
    
    // Crear un nuevo chat
    saveChat: function(req, res){
        var chat = new Chat();
        var params = req.body;
        var role = req.user.role;

        if(role != 'ROLE_ADMIN') return res.status(404).send({ message: 'No tienes permiso para acceder a esta zona' });

        chat.name = params.name;
        chat.capacity = params.capacity;
        chat.image = null;
        chat.description = params.description;
        chat.password = params.password;


        if(chat.name != null && chat.capacity != null && chat.description != null && chat.password){
            // Encriptar la contraseña
            bcrypt.hash(chat.password, null, null, (err, hash) => {
                chat.password = hash;
                // Guardamos el chat en la base de datos
                chat.save((err, chatStored) => {
                    if(err) return res.status(500).send({ message: 'Se produjo un error en el servidor' });
                    if(!chatStored) return res.status(404).send({ message: 'No se guardó el chat' });

                    return res.status(200).send({chat: chatStored });
                });
            });
        } else {
            return res.status(404).send({message: 'Ingresa todos los datos del formulario'});
        }

    },

    // Obtener un chat por id
    getChat: function(req, res){
        var chatId = req.params.id;

        Chat.findOne({_id: chatId}).exec((err, chat) => {
            if(err) return res.status(500).send({ message: 'Se produjo un error en el servidor' });
            if(!chat) return res.status(404).send({ message: 'No se obtuvo el chat' });

            return res.status(200).send({ chat });
        });
    },

    // Obtener todos los chats (acceso a todos los identificados)
    getChats: function(req, res){
        Chat.find().exec((err, chats) => {
            if(err) return res.status(500).send({ message: 'Se produjo un error en el servidor' });
            if(!chats) return res.status(404).send({ message: 'No se obtuvieron los chats' });

            return res.status(200).send({ chats });
        });
    },

    // Editar un chat: Solo para poder editar su capacidad
    updateChat: function(req, res){
        var chatId = req.params.id;
        var update = req.body;
        var role = req.user.role;

        if(role != 'ROLE_ADMIN') return res.status(404).send({ message: 'No tienes permiso para entrar a esta zona' });

        Chat.findByIdAndUpdate(chatId, update, {new: true}, (err, chatUpdated) => {
            if(err) return res.status(500).send({ message: 'Se produjo un error en el servidor' });
            if(!chatUpdated) return res.status(404).send({ message: 'Chat no exitente o no encontrado' });

            return res.status(200).send({ chat:  chatUpdated});
        });
    },

    // Eliminar un chat
    deleteChat: function(req, res){
        var chatId = req.params.id;
        Chat.findOneAndDelete({'_id': chatId}, (err, chatDeleted) => {
            if(err) return res.status(500).send({ message: 'Se produjo un error en el servidor' });
            if(!chatDeleted) return res.status(404).send({ message: 'No existe el chat' });

            Message.find({ 'chat': chatDeleted._id }).remove((err, deletedMessages) => {
                if(err) return res.status(500).send({ message: 'Se produjo un error en el servidor' });
                if(!deletedMessages) return res.status(404).send({ message: 'No se eliminaron los mensajes' });

                return res.status(200).send({ chat:chatDeleted });
            });
        });
    },

    // Subir imagen para el chat
    uploadImage: function(req, res){
        var chatId = req.params.id;

        if(req.files){
            var file_path = req.files.imageChat.path;
            var file_split = file_path.split('/');
            var file_name = file_split[2];

            // Obtener extensión y comprobarla
            var ext_split = file_path.split('\.');
            var ext = ext_split[1];

            if(ext == 'jpeg' || ext == 'png' || ext == 'jpg' || ext == 'gif'){
                // Actualizar la imagen del chat en la base de datos
                Chat.findByIdAndUpdate(chatId, {image: file_name}, {new: true}, (err, chatUpdated) => {
                    if(err) return res.status(500).send({ message: 'Se produjo un error en el servidor' });
                    if(!chatUpdated) return res.status(404).send({message: 'No se actualizó la imagen del chat'});

                    return res.status(200).send({ chat: chatUpdated });
                });
            } else {
                // Función para eliminar de la carpeta de uploads/chats
                removeFromUploads(res, file_name, 'Extensión no valida. Vuelve a intentar con otra imagen');
            }
        } else {
            return res.status(200).send({ message: 'Imagen no seleccionada' });
        }
    },

    // Obetenr la imagen del chat
    getImage: function(req, res){
        var imageFile = req.params.imageFile;
        var file_path = './uploads/chats/' + imageFile;
        fs.exists(file_path, (exists) => {
            if(exists){
                return res.sendFile(path.resolve(file_path));
            } else {
                return res.status(200).send({ message: 'La imagen no existe' });
            }
        });
    },

    // Validar la contraseña
    validateChat: function(req, res){
        var chatId = req.params.id;
        var params = req.body;
        var password = params.password; // Contraseña insertada por el usuario

        Chat.findById(chatId, (err, chat) => {
            if(err) return res.status(500).send({ message: 'Se produjo un error en el servidor' });
            if(!chat) return res.status(404).send({ message: 'El chat no existe' });
            bcrypt.compare(password, chat.password, (err, check) => {
                if(check){
                    return res.status(200).send({ chat });
                } else {
                    return res.status(404).send({ message: 'Contraseña incorrecta' });
                }
            });
        });
    }


}

function removeFromUploads(res, file_path, message){
    fs.unlink(file_path, (err) => {
        return res.status(200).send({message: message});
    });
}

module.exports = controller;