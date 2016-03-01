'use strict';

var http = require('http'); // TODO: https?
var express = require('express');
var compression = require('compression');
var io = require('socket.io');

var config = require('./mese.config');
var util = require('./mese.util');
var db = require('./mese.db');
var socket = require('./mese.socket');

process.on('uncaughtException', function (err) {
    util.log('uncaught exception');
    util.log(err.stack || err);
});

util.log('db init ' + config.db);

db.init(config.db, function () {
    util.log('server init ' + config.port);

    var app = express();
    var server = http.createServer(app);

    app.use(function (req, res, next) {
        util.log('web ' + req.ip + ' ' + req.url);
        next();
    });

    app.use(compression());
    app.use(express.static('./res', {
        index: 'page.html',
        fallthrough: false,
    }));

    app.use(function (err, req, res, next) {
        if (err.status == 404) {
            util.log('web not found ' + req.path);
        } else {
            util.log('web error');
            util.log(err.stack || err);
        }

        res.status(err.status || 500);
        res.end();
    });

    io(server).on('connection', socket);

    server.listen(config.port, function () {
        util.log('server ready');
    });
});
