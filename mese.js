'use strict';

var config = require('./mese.config');
var util = require('./mese.util');
var access = require('./mese.access');
var web = require('./mese.web');
var socket = require('./mese.socket');

process.on('uncaughtException', function (err) {
    util.log('uncaught exception');
    util.err(err);
});

util.log('db init ' + config.db);

access.init(config.db, function () {
    util.log('server init ' + config.port);

    web(config.port, 'page.html', function (server) {
        util.log('socket init');

        socket(server);
    }, function () {
        util.log('ready');
    });
});
