'use strict'
var jwt = require('jwt-simple');
var moment = require('moment');
var secret_key = '137955';

exports.ensureAuth = function(req, res, next){
    if(!req.headers.authorization){
        return res.status(403).send({ message: 'Petición sin cabecera de autorización' });
    }
    var token = req.headers.authorization.replace(/['"]+/g, '');

    try {
        var payload = jwt.decode(token, secret_key);
        if(payload.exp <= moment().unix()) return res.status(401).send({ message: 'El token ha expirado' });
    } catch(ex) {
        return res.status(404).send({ message: 'Token no válido' });
    }

    req.user = payload;

    next();
}