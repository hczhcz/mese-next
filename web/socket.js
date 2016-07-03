'use strict';

define('socket', function (require, module) {
    var message = require('ui.message');

    var socket = io(window.location.origin);

    var connected = false;

    socket.on('connect', function () {
        connected = true;
        message('Connected');
    });

    socket.on('disconnect', function () {
        connected = false;
        message('Connection lost');
    });

    socket.on('message', function (data) {
        message(data);
    });

    socket.poll = function (action, interval) {
        setInterval(function () {
            if (connected) {
                action();
            }
        }, interval);
    };

    module.exports = socket;
});
