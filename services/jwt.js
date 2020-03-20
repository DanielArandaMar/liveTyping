'use strict'
var jwt = require('jwt-simple');
var moment = require('moment');
var secret_key = "137955";

exports.createToken = function(user){
    var payload = {
        sub: user._id,
        name: user.name,
        nick: user.nick,
        email: user.email,
        role: user.role,
        image: user.image,
        iat: moment().unix(),
        exp: moment().add(30, 'days').unix
    };

    return jwt.encode(payload, secret_key);
}