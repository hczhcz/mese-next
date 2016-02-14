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

var server = http.createServer(web).listen(config.port);

util.log('server init ' + config.port);

db.init(function () {
    io(server).on('connection', socket);
});
