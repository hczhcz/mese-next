'use strict';

var io = require('socket.io');

var util = require('./util');

module.exports = function (server, handlers) {
    io(server).on('connect', function (socket) {
        util.log('connect ' + socket.conn.remoteAddress);

        var session = {};

        session.log = function (info) {
            util.log('[' + (session.user || socket.conn.remoteAddress) + '] ' + info);
        };

        socket.on('error', function (err) {
            util.log('socket error');
            util.err(err);
        });

        socket.on('disconnect', function () {
            util.log('disconnect ' + socket.conn.remoteAddress);
        });

        for (var i in handlers) {
            handlers[i](socket, session);
        }
    });
};
