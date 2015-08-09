'use strict';

var port = 63000;

var fs = require('fs');
var domain = require('domain');
var http = require('http'); // TODO: https?
var io = require('socket.io');

var page = fs.readFileSync('./page.html');

var server = http.createServer(function (req, res) {
    var d = domain.create();

    d.on('error', function (e) {
        // ignore
    });

    d.add(req);
    d.add(res);

    d.run(function () {
        res.writeHead(200);
        res.end(page);
    });
}).listen(port);

io(server).on('connection', function (socket) {
    var d = domain.create();

    d.on('error', function (e) {
        // ignore
    });

    d.add(socket);

    d.run(function () {
        socket.on('login', function (data) {
            socket.on('submit', function (data) {
                //
            });
            socket.on('password', function (data) {
                //
            });
        });
    });
});
