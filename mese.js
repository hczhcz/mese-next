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
        // res.end(page); // TODO
        res.end(fs.readFileSync('./page.html')); // for debug
    });
}).listen(port);

db.init(function () {
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

            var authName = undefined;
            var authPassword = undefined;
            var authStorage = undefined;

            socket.on('login', function (data) {
                // name, password

                if (
                    !util.verify(/^[A-Za-z0-9_ ]+$/, data.name)
                    || !util.verify(/^.+$/, data.password)
                ) {
                    return;
                }

                util.log('login ' + data.name);

                var storage = db.access('users', data.name);

                storage.staticGet('password', function (password) {
                    if (password === undefined) {
                        util.log('new user ' + data.name);

                        storage.staticSet(
                            'password', data.password,
                            function (doc) {
                                authName = data.name;
                                authPassword = data.password;
                                authStorage = storage;

                                socket.emit('login_new');
                            }
                        );
                    } else if (password === data.password) {
                        authName = data.name;
                        authPassword = data.password;
                        authStorage = storage;

                        socket.emit('login_ok');
                    } else {
                        util.log('wrong password ' + data.name);

                        socket.emit('login_fail');
                    }
                });
            });

            socket.on('submit', function (data) {
                // game, price, prod, mk, ci, rd

                if (
                    !authName
                    || !util.verify(/^[0-9]+$/, data.game)
                    || !util.verify(/^[0-9]+$/, data.price)
                    || !util.verify(/^[0-9]+$/, data.prod)
                    || !util.verify(/^[0-9]+$/, data.mk)
                    || !util.verify(/^[0-9]+$/, data.ci)
                    || !util.verify(/^[0-9]+$/, data.rd)
                ) {
                    return;
                }

                core.exec(
                    [
                        'submit', 1 /* TODO */,
                        data.price, data.prod, data.mk, data.ci, data.rd
                    ],
                    '', // TODO
                    function (code, output) {
                        // TODO
                        if (code) {
                            // decision not accepted
                        }

                        core.exec(
                            ['close'],
                            '', // TODO
                            function (code, output) {
                                if (code) {
                                    // TODO
                                    return;
                                }
                            }
                        );
                    }
                );
            });

            socket.on('password', function (data) {
                // password, newPassword

                if (
                    !authName
                    || !util.verify(/^[A-Za-z0-9_ ]+$/, data.password)
                    || !util.verify(/^.+$/, data.newPassword)
                ) {
                    return;
                }

                util.log('change password ' + data.name);

                if (data.password === authPassword) {
                    authStorage.staticSet(
                        'password', data.newPassword,
                        function (doc) {
                            authPassword = password;

                            socket.emit('password_ok');
                        }
                    );
                } else {
                    util.log('wrong password ' + data.name);

                    socket.emit('password_fail');

                    return;
                }
            });
        });
    });
});
