'use strict';

var io = require('socket.io');

var util = require('./mese.util');

module.exports = function (server) {
    io(server).on('connection', function (socket) {
        util.domainRunCatched([socket], function () {
            util.log('connect ' + socket.conn.remoteAddress);

            var session = {};

            session.user = undefined;
            session.sudo = false;
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

            // TODO
            require('./mese.socket.user')(socket, session);
            require('./mese.socket.game')(socket, session);
            require('./mese.socket.admin')(socket, session);
            require('./mese.socket.admin.game')(socket, session);
        });
    });
};
