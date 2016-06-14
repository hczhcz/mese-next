'use strict';

var http = require('http'); // TODO: https?
var express = require('express');
var compression = require('compression');

var util = require('./util');

module.exports = function (port, index, plugin, callback) {
    var app = express();
    var server = http.createServer(app);

    app.use(function (req, res, next) {
        util.log('web ' + req.ip + ' ' + req.url);
        next();
    });

    app.use(compression());
    app.use(express.static('./res', {
        index: index,
        fallthrough: false,
    }));

    app.use(function (err, req, res, next) {
        if (err.status == 404) {
            util.log('web not found ' + req.path);
        } else {
            util.log('web error ' + err.status + ' ' + req.path);
            util.err(err);
        }

        res.status(err.status || 500);
        res.end();
    });

    plugin(server);

    server.listen(port, callback);
};
