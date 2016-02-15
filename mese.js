'use strict';

var http = require('http'); // TODO: https?
var io = require('socket.io');

var config = require('./mese.config');
var util = require('./mese.util');
var db = require('./mese.db');
var socket = require('./mese.socket');
var web = require('./mese.web');

process.on('uncaughtException', function (e) {
    util.log('uncaught exception');
    util.log(e.stack || e);
});

util.log('db init ' + config.db);

db.init(config.db, function () {
    util.log('server init ' + config.port);

    var server = http.createServer(web).listen(config.port);

    util.log('socket init');

    io(server).on('connection', socket);
});
