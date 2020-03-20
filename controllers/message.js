'use strict'
var Message = require('../models/message');
var Chat = require('../models/chat');
var User = require('../models/user');
var controller = {

    // Crear un nuevo mensaje
    saveMessage: function(req, res){
        var message = new Message();
        var params = req.body;

        message.user = req.user.sub;
        message.chat = params.chat;
        message.text = params.text;

        if(message.user != null && message.chat != null && message.text != null){
            message.save((err, messageStored) => {
                if(err) return res.status(500).send({ message: 'Se produjo un error en el servidor' });
                if(!messageStored) return res.status(404).send({ message: 'No se envió el mensaje' });

                // Buscar al usuario
                User.findById(messageStored.user, (err, user) =>  {
                    if(err) return res.status(500).send({ message: 'Se produjo un error en el servidor' });
                    if(!user) return res.status(404).send({ message: 'No existe el usuario' });
                    return res.status(200).send({ message: messageStored, user: user });
                });
               
            });
        } else {
            return res.status(404).send({message: 'Ingresa el mensaje'});
        }
    },

    // Obtener mensajes de un usuario en un chat
    getMessagesByUser: function(req, res){
        var chatId = req.params.chatId;
        messages(chatId, req, res).then((value) => {
            return res.status(200).send({
                messages: value.myMessages
            });
           
        });
    },

    // Obetenr todos los mensajes de un chat
    getMessages: function(req, res){
        var chatId = req.params.chatId;
        Message.find({ 'chat': chatId }).populate('user', 'name nick image').populate('chat',' name ').exec((err, messages) => {
            if(err) return res.status(500).send({ message: 'Se produjo un error en el servidor' });
            if(!messages) return res.status(404).send({ message: 'No se obtuvieron los mensajes' });

            return res.status(200).send({ messages});
        });
    }


};

/* Obtener todos los mensajes del usuario identificado en un chat
*/ 
async function messages(chatId, req, res){
    var userId = req.user.sub;
    var myMessages = await Message.find({ 'user': userId, 'chat': chatId }).populate('user', 'name nick image').exec().then((messages) => {
        return messages;
    }).catch((err) => {
        return handleError(err);
    });

    return {
        myMessages: myMessages
    }
}

module.exports = controller;