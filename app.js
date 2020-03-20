'use strict'
var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var fs = require('fs');
var moongose = require('mongoose');
var port = process.env.PORT || 2800;
var app = express();

// RUTAS DE API
var user_routes = require('./routes/user');
var chat_routes = require('./routes/chat');
var message_routes = require('./routes/message');

// SOCKETS
var server = require('http').createServer(app);
var io = require('socket.io')(server);

io.on('connection', function(socket){
    // Mensaje enviado desde el cliente
    socket.on('saveMessage', function(data){
       io.emit('sendMessage', {message: data.message, user: data.user});
    });

});


// CRACION DE SERVIDOR Y CONEXIÓN A BASE DE DATOS
moongose.Promise = global.Promise;
moongose.connect('mongodb://localhost:27017/live_typing', { useNewUrlParser: true ,  useUnifiedTopology: true})
    .then(() => {
        console.log(' -> -> -> -> Conexion a la base de datos hecha con EXITO <- <- <- <- <-');

        server.listen(port, () => {
            console.log(' -> -> -> -> Servidor corriendo por http://localhost:2800 <- <- <- <- <-');
        });
    })
    .catch(err => console.log(err));

// MIDDLEWARES
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// CORS 
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
    next();
});

// DECLARACIÓN DE RUTAS
app.use('/', express.static('client', {redirect: false}));
app.use('/api', user_routes);
app.use('/api', chat_routes);
app.use('/api', message_routes);
app.get('*', function(req, res, next){
    res.senFile(path.resolve('client/index.html'));
});

// EXPORTAR
module.exports = app;