'use strict'
var User = require('../models/user');
var bcrypt = require('bcrypt-nodejs');
var jwt = require('../services/jwt');
var fs = require('fs');
var path = require('path');

var controller = {

    // Registrar al usuario
    saveUser: function(req, res){
        var user = new User;
        var params = req.body;
        
        user.name = params.name;
        user.nick = params.nick;
        user.email = params.email;
        user.password = params.password;
        user.role = 'ROLE_USER';
        user.activeChat = null;
        user.status = false;
        user.incognit = false;
        user.image = null;

        if(user.name != null && user.nick != null && user.email != null &&user.password != null){
            // Comprobar si el nombre de usuario no este registrados
            User.find({
                nick: user.nick
             }).exec((err, users) => {
                if(err) return res.status(500).send({ message: 'Se produjo un error en el servidor' });
                if(users && users.length >= 1){
                    return res.status(404).send({message: 'Nombre de usuario ya registrado'});
                } else {
                    // Comprobar si el email no esta registrado
                    User.find({ email: user.email }).exec((err, users) => {
                        if(err) return res.status(500).send({ message: 'Se produjo un error en el servidor' });
                        if(users && users.length >= 1){
                            return res.status(404).send({message: 'Esta cuenta ya ha sido registrada'});
                        } else {
                            /* Validar el nombre de usuario */
                            user.nick.trim();
                            if(user.nick.length <= 4) return res.status(404).send({message: 'El nombre de usuario tienen que tener minimo 5 carácteres'});
                            if(user.nick.length > 7) return res.status(404).send({message: 'El nombre de usuario tienen que tener máximo 7 carácteres'});

                            /* Validar la contraseña */
                            user.password.trim();
                            if(user.password.length < 8) return res.status(404).send({message: 'La contraseña tienen que tener minimo 8 carácteres'});

                            // Guardar en la base de datos
                            bcrypt.hash(user.password, null, null, (err, hash) => {
                                if(err) return res.status(500).send({message: 'Error interno'});
                                user.password = hash;
                                user.save((err, storedUser) => {
                                    if(err) return res.status(500).send({ message: 'Se produjo un error en el servidor' });
                                    if(!storedUser) return res.status(404).send({ message: 'Registro no realizado' });
                                    
                                    user.password = undefined;
                                    return res.status(200).send({ user: storedUser });
                                });
                            });
                        }

                    });
                  
                }
            });

        } else {
            return res.status(404).send({message: 'Ingresa todos los datos del formulario'});
        }

    },

    // Inicio de sesión para el usuario
    logIn: function(req, res){
        var params = req.body;

        var nick = params.nick;
        var password = params.password;

        User.findOne({ nick: nick }, (err, user) => {
            if(err) return res.status(500).send({ message: 'Se produjo un error en el servidor' });
            if(!user) return res.status(404).send({ message: 'Nombre de usario o contraseña incorrectos' });

            // Comparar las contraseñas
            bcrypt.compare(password, user.password, (err, check)=> {
                user.password = undefined;
                if(check){
                    if(params.getHash){
                        return res.status(200).send({
                            token: jwt.createToken(user)
                        });
                    } else {
                        return res.status(200).send({
                            user
                        });
                    }
                } else {
                    return res.status(404).send({ message: 'Nombre de usario o contraseña incorrectos' });
                }
            });
        });
    },

    // Obtener todos los usuarios 
    getUsers: function(req, res){
        User.find((err, users) => {
            if(err) return res.status(500).send({ message: 'Se produjo un error en el servidor' });
            if(!users) return res.status(404).send({ message: 'No se pudieron obtener a los usuarios' });

            return res.status(200).send({ users })
        });
    },

    // Actualizar datos del usuario identificado
    updateUser: function(req, res){
        var userId = req.user.sub;
        var update = req.body;
        delete update.password;

        User.findByIdAndUpdate(userId, update, {new: true}, (err, updatedUser) => {
            if(err) return res.status(500).send({ message: 'Se produjo un error en el servidor' });
            if(!updatedUser) return res.status(404).send({ message: 'Usuario no identificado o no existente' });

            // Comprobar que el nombre de usuario no se repita
            User.find({ nick: updatedUser.nick }).exec((err, users) => {
                if(users && users.length >= 2){
                    return res.status(404).send({ message: 'El nombre de usuario ya ha sido registrado' });
                } else {
                     /* Validar el nombre de usuario */
                     updatedUser.nick.trim();
                     if(updatedUser.nick.length <= 4) return res.status(404).send({message: 'El nombre de usuario tienen que tener minimo 5 carácteres'});
                     if(updatedUser.nick.length > 7) return res.status(404).send({message: 'El nombre de usuario tienen que tener máximo 7 carácteres'});
                    // Actualizamos el usuario con éxito
                    updatedUser.password = undefined;
                    return res.status(200).send({
                        user: updatedUser
                    });
                }
            });
        });
    },

    // Subir una imagen para el usuario
    uploadImage: function(req, res){
        var id = req.user.sub;

        if(req.files){
            var file_path = req.files.image.path;
            var file_split = file_path.split('/');
            var file_name = file_split[2];

            // Extención del archivo
            var ext_split = file_path.split('\.');
            var ext = ext_split[1];

            if(ext == 'png' || ext == 'jpg' || ext == 'jpeg' || ext == 'gif'){
                // Actualizar el usuario en la base de datos
                User.findByIdAndUpdate(id, { image: file_name }, { new: true }, (err, userUpdated) => {
                    if(err) return res.status(500).send({ message: 'Se produjp un error en el servidor' });
                    if(!userUpdated) return res.status(404).send({ message: 'No se actualizó la foto' });

                    userUpdated.password = undefined;
                    return res.status(200).send({ user: userUpdated });
                });
            } else {
                // Funcion para remover de carpeta de uploads
                removeFromUploads(res, file_path, 'Extensión no valida. Vuelve a probar con otra imagen');
            }
        } else {
            return res.status(200).send({ message: 'Imagen no seleccionada' });
        }
    },

    // Obtener imagen del usuario
    getImageUser: function(req, res){
        var imageFile = req.params.imageFile;
        var file_path = './uploads/users/' + imageFile;

        fs.exists(file_path, (exists) => {
            if(exists){
                return res.sendFile(path.resolve(file_path));
            } else {
                return res.status(200).send({ message: 'La imagen no existe' });
            }
        });
    },

    // Actualizar propiedad activeChat
    updateActiveChat: function(req, res){
        var userId = req.user.sub; // Para el usuario identificado
        var chatId = req.params.chatId; 

        User.findById(userId, (err, user) => {
            if(err) return res.status(500).send({ message: 'Se produjo un error en el servidor' });
            if(!user) return res.status(404).send({ message: 'El usuario no existe' });

            // Si el usuaio no tienen ningún chat asignado
            if(user.activeChat == null){
                User.update({'_id': userId}, {activeChat: chatId}, {new: true}, (err, updateUser) => {
                    if(err) return res.status(500).send({ message: 'Se produjo un error en el servidor' });
                    if(!updateUser) return res.status(404).send({ message: 'No se pudo realizar la acción' });
        
                    return res.status(200).send({
                         user: updateUser
                    });
                });
            } else {
                 // Si el usuaio tiene un chat asignado, marcarlo como nulo
                User.update({'_id': userId}, {activeChat: null}, {new: true}, (err, updateUser) => {
                    if(err) return res.status(500).send({ message: 'Se produjo un error en el servidor' });
                    if(!updateUser) return res.status(404).send({ message: 'No se pudo realizar la acción' });
        
                    return res.status(200).send({
                         user: updateUser
                    });
                });
            }
        });

        
        
    },

    // Obtener todos los usuarios que estan en un chat en particular
    getCounters: function(req, res){
        var chatId = req.params.chatId;

        getCounters(chatId).then((value) => {
            return res.status(200).send({
                usersInChat: value.usersInChat,
                totalUsers: value.totalUsers
            });
        });
    },

    // Obetener datos de mi usuario
    getMyUser: function(req, res){
        let id = req.user.sub;
        User.findById(id, (err, user) => {
            if(err) return res.status(500).send({ message: 'Se produjo un error en el servidor' });
            if(!user) return res.status(404).send({ message: 'El usuario no existe' });
            return res.status(200).send({ user });
        });
    },

    // Actualizar el estado del usuario
    updateUserStatus: function(req, res){
        let id = req.user.sub;
        User.findById(id, (err, user) => {
            if(err) return res.status(500).send({ message: 'Se produjo un error en el servidor' });
            if(!user) return res.status(404).send({ message: 'El usuario no existe' });
            if(user.status == false){
                User.findByIdAndUpdate(user._id, {status: true}, {new: true}, (err, userUpdated) => {
                    if(err) return res.status(500).send({ message: 'Se produjo un error en el servidor' });
                    if(!userUpdated) return res.status(404).send({ message: 'Status del usuario no actualizado' });
                    return res.status(200).send({ user: userUpdated });
                });
            } else if(user.status == true){
                User.findByIdAndUpdate(user._id, {status: false}, {new: true}, (err, userUpdated) => {
                    if(err) return res.status(500).send({ message: 'Se produjo un error en el servidor' });
                    if(!userUpdated) return res.status(404).send({ message: 'Status del usuario no actualizado' });
                    return res.status(200).send({ user: userUpdated });
                });
            }
        });
    }
};

function removeFromUploads(res, file_path, message){
    fs.unlink(file_path, (err) => {
        return res.status(200).send({message: message});
    });
}

// Funciones para obtener distintos datos de contadores respecto a usuarios
async function getCounters(chatId){

    var usersInChat = await User.find({activeChat: chatId}).exec().then((users) => {
        return users.length;
    }).catch((err) => {
        return handleError(err);
    });

    var totalUsers = await User.find().exec().then((users) => {
        return users.length
    }).catch((err) => {
        return handleError(err);
    });


    return {
        usersInChat: usersInChat,
        totalUsers: totalUsers
    }
}

module.exports = controller;
