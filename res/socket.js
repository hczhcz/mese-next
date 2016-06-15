'use strict';

var socket = io(window.location.origin);

var connected = false;

socket.on('connect', function () {
    connected = true;
    message('Connected');

    autoLogin();
});

socket.on('disconnect', function () {
    connected = false;
    message('Connection lost');
});

socket.on('message', function (data) {
    message(data);
});
