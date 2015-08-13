'use strict';

var port = 63000;

var fs = require('fs');
var domain = require('domain');
var http = require('http'); // TODO: https?
var io = require('socket.io');
var util = require('./mese.util');
var core = require('./mese.core');
var db = require('./mese.db');

var page = fs.readFileSync('./page.html');

var server = http.createServer(function (req, res) {
    var d = domain.create();

    d.on('error', function (e) {
        util.log(e);
    });

    d.add(req);
    d.add(res);

    d.run(function () {
        util.log('web ' + req.connection.remoteAddress);

        res.writeHead(200);
        res.end(page);
    });
}).listen(port);

var socketList = [];
var socketNext = 0;

io(server).on('connection', function (socket) {
    util.log('socket ' + socket.conn.remoteAddress);

    var d = domain.create();

    d.on('error', function (e) {
        util.log(e);
    });

    d.add(socket);

    d.run(function () {
        socketList[socketNext] = socket;
        socketNext += 1;
        if (socketNext >= 4096) { // buffer size
            socketNext = 0;
        }

        socket.on('login', function (auth) {
            // name, password

            if (
                !util.verify(/^[A-Za-z0-9_ ]+$/, auth.name)
                || !util.verify(/^.+$/, auth.password)
            ) {
                return;
            }

            util.log('login ' + auth.name);

            var storage = db.access('users', auth.name);
            storage.staticGet('password', function (password) {
                if (password !== undefined && password !== auth.password) {
                    return;
                }

                socket.on('submit', function (data) {
                    // price, prod, mk, ci, rd

                    if (
                        !util.verify(/^[0-9]+$/, data.price)
                        || !util.verify(/^[0-9]+$/, data.prod)
                        || !util.verify(/^[0-9]+$/, data.mk)
                        || !util.verify(/^[0-9]+$/, data.ci)
                        || !util.verify(/^[0-9]+$/, data.rd)
                    ) {
                        return;
                    }

                    // TODO
                });
                socket.on('password', function (data) {
                    // password, newPassword

                    if (
                        !util.verify(/^[A-Za-z0-9_ ]+$/, data.password)
                        || !util.verify(/^.+$/, data.newPassword)
                    ) {
                        return;
                    }

                    if (data.password !== password) {
                        return;
                    }

                    storage.staticSet(
                        'password', data.newPassword,
                        function (doc) {
                            // TODO
                        }
                    );
                });
            });
        });
    });
});
