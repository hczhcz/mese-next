'use strict';

var config = require('./config');
var util = require('./util');
var access = require('./server.access');
var web = require('./server.web');
var socket = require('./server.socket');

process.on('uncaughtException', function (err) {
    util.log('uncaught exception');
    util.err(err);
});

util.log('db init ' + config.db);

access.init(config.db, function () {
    util.log('server init ' + config.port);

    web(config.port, 'mese.html', function (server) {
        util.log('socket init');

        socket(
            server,
            [
                require('./site.socket.user'),
                require('./site.socket.admin'),
                require('./mese.socket.game'),
                require('./mese.socket.admin'),
                require('./rtmese.socket.game'),
                require('./rtmese.socket.admin'),
            ]
        );
    }, function () {
        util.log('ready');
    });
});
