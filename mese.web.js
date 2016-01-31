'use strict';

var fs = require('fs');
var domain = require('domain');

var util = require('./mese.util');

var libJQuery = fs.readFileSync('./res/jquery.min.js');
var libSocketIO = fs.readFileSync('./res/socket.io.min.js');

module.exports.handler = function (req, res) {
    var d = domain.create();

    d.on('error', function (e) {
        util.log(e.stack || e);
    });

    d.add(req);
    d.add(res);

    d.run(function () {
        util.log('web ' + req.connection.remoteAddress + ' ' + req.url);

        req.url = req.url.split('?')[0];

        if (req.url == '/jquery.min.js') {
            res.writeHead(200, {
                'Content-Type': 'application/javascript',
            });
            res.end(libJQuery);
        } else if (req.url == '/socket.io.min.js') {
            res.writeHead(200, {
                'Content-Type': 'application/javascript'
            });
            res.end(libSocketIO);
        } else if (req.url == '/page.js') {
            fs.readFile('./res/page.js', function (err, data) {
                if (err) {
                    throw err;
                } else {
                    res.writeHead(200, {
                        'Content-Type': 'application/javascript',
                    });

                    res.end(data);
                }
            });
        } else if (req.url == '/') {
            fs.readFile('./res/page.html', function (err, data) {
                if (err) {
                    throw err;
                } else {
                    res.writeHead(200, {
                        'Content-Type': 'text/html',
                    });

                    res.end(data);
                }
            });
        } else {
            res.writeHead(404, {
                'Content-Type': 'text/plain',
            });

            res.end('Not found');
        }
    });
};
