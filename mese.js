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

var socketList = [];
var socketNext = 0;

io(server).on('connection', function (socket) {
    console.log('socket ' + socket.conn.remoteAddress);

    var d = domain.create();

    d.on('error', function (e) {
        console.log(e);
    });

    d.add(socket);

    d.run(function () {
        socketList[socketNext] = socket;
        socketNext += 1;
        if (socketNext >= 4096) { // buffer size
            socketNext = 0;
        }

        socket.on('login', function (data) {
            // name, password

            if (typeof data.name != 'string') {
                return;
            }
            if (typeof data.password != 'string') {
                return;
            }
            if (!/^[A-Za-z0-9_ ]+$/.test(data.name)) {
                return;
            }

            console.log('login ' + data.name);

            socket.on('submit', function (data) {
                // price, prod, mk, ci, rd

                if (typeof data.price != 'string') {
                    return;
                }
                if (typeof data.prod != 'string') {
                    return;
                }
                if (typeof data.mk != 'string') {
                    return;
                }
                if (typeof data.ci != 'string') {
                    return;
                }
                if (typeof data.rd != 'string') {
                    return;
                }
                if (!/^[0-9]+$/.test(data.price)) {
                    return;
                }
                if (!/^[0-9]+$/.test(data.prod)) {
                    return;
                }
                if (!/^[0-9]+$/.test(data.mk)) {
                    return;
                }
                if (!/^[0-9]+$/.test(data.ci)) {
                    return;
                }
                if (!/^[0-9]+$/.test(data.rd)) {
                    return;
                }

                // TODO
            });
            socket.on('password', function (data) {
                // password, newPassword

                if (typeof data.password != 'string') {
                    return;
                }
                if (typeof data.newPassword != 'string') {
                    return;
                }

                // TODO
            });
        });
    });
});
