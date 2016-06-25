'use strict';

define('login', function (require, module) {
    var socket = require('socket');

    var currentLogin = undefined;

    var get = function (callback) {
        if (currentLogin !== undefined) {
            callback(currentLogin);
        } else {
            var loginInfo = localStorage.getItem('MESE_login');

            if (loginInfo !== null) {
                currentLogin = JSON.parse(loginInfo);
                callback(currentLogin);
            }
        }
    };

    socket.on('connect', function () { // notice: an extra hook
        // auto login

        get(function (login) {
            socket.emit('login', login);
        });
    });

    module.exports.sha = function (str) {
        var shaObj = new jsSHA('SHA-256', 'TEXT');

        shaObj.setHMACKey('MESE-Next', 'TEXT');
        shaObj.update(str);

        return shaObj.getHMAC('BYTES');
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
});
