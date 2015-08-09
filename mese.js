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
        console.log(e);
    });

    d.add(req);
    d.add(res);

    d.run(function () {
        console.log('web ' + req.connection.remoteAddress);

        res.writeHead(200);
        res.end(page);
    });
}).listen(port);

io(server).on('connection', function (socket) {
    console.log('socket ' + socket.conn.remoteAddress);

    var d = domain.create();

    d.on('error', function (e) {
        console.log(e);
    });

    d.add(socket);

    d.run(function () {
        socket.on('login', function (data) {
            if (typeof data.name != 'string') {
                return;
            }
            if (typeof data.password != 'string') {
                return;
            }
            if (!/^[A-Za-z0-9_ ]+$/i.test(name)) {
                return;
            }

            console.log('login ' + data.name);

            socket.on('submit', function (data) {
                //
            });
            socket.on('password', function (data) {
                //
            });
        });
    });
});
