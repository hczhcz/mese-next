'use strict';

var config = require('./mese.config');
var util = require('./mese.util');
var db = require('./mese.db');
var web = require('./mese.web');
var socket = require('./mese.socket');

process.on('uncaughtException', function (err) {
    util.log('uncaught exception');
    util.log(err.stack || err);
});

util.log('db init ' + config.db);

db.init(config.db, function () {
    util.log('server init ' + config.port);

    web(config.port, function (server) {
        util.log('socket init');

        socket(server);
    }, function () {
        util.log('ready');
    });
});
