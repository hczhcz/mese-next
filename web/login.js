'use strict';

define('login', function (require, module) {
    var socket = require('socket');

    var currentLogin = undefined;

    module.exports.sha = function (str) {
        var shaObj = new jsSHA('SHA-256', 'TEXT');

        shaObj.setHMACKey('MESE-Next', 'TEXT');
        shaObj.update(str);

        return shaObj.getHMAC('BYTES');
    };

    module.exports.get = function (callback) { // TODO: need export?
        if (currentLogin) {
            callback(currentLogin);
        } else {
            var loginInfo = localStorage.getItem('MESE_login');

            if (loginInfo) {
                currentLogin = JSON.parse(loginInfo);
                callback(currentLogin);
            }
        }
    };

    module.exports.set = function (login, save, callback) {
        currentLogin = login;

        if (save) {
            localStorage.setItem('MESE_login', JSON.stringify(login));
        }

        callback(currentLogin);
    };

    module.exports.reset = function () {
        currentLogin = undefined;

        localStorage.removeItem('MESE_login');
    };

    socket.on('connect', function () { // notice: an extra hook
        // auto login

        module.exports.get(function (login) {
            socket.emit('login', login);
        });
    });
});
