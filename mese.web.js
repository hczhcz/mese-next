'use strict';

var http = require('http'); // TODO: https?
var express = require('express');
var compression = require('compression');

var util = require('./mese.util');

module.exports = function (port, plugin, callback) {
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

    plugin(server);

    server.listen(port, callback);
};
