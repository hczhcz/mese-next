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

                var gameStorage = db.access('games', 'test');
                var players = gameStorage.staticGet('players');
                var gameData = gameStorage.staticGet('data');

                var player = -1;
                for (var i in players) {
                    if (players[i] === authName) {
                        player = i;
                    }
                }

                if (player >= 0) {
                    core.submit( // TODO: protection?
                        gameData, player,
                        data.price, data.prod, data.mk, data.ci, data.rd,
                        function (output) {
                            // submit ok

                            core.printPlayerEarly(
                                output,
                                player,
                                function (output) {
                                    socket.emit(
                                        'submit_ok',
                                        eval('(' + output + ')')
                                    );
                                }
                            );

                            core.close(
                                output,
                                function (output) {
                                    // closed
                                },
                                function (output) {
                                    // not closed, ignore
                                }
                            );
                        },
                        function (output) {
                            // submit declined

                            core.printPlayerEarly(
                                output,
                                player,
                                function (output) {
                                    socket.emit(
                                        'submit_decline',
                                        eval('(' + output + ')')
                                    );
                                }
                            );
                        }
                    );
                } else {
                    socket.emit('submit_fail');
                }
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

    var test = function () {
        var size = 0;

        var doAlloc = function (output) {
            if (size >= 7) {
                var gameStorage = db.access('games', 'test');

                gameStorage.staticSet(
                    'data', output,
                    function (doc) {
                        // nothing
                    }
                );
                gameStorage.staticSet(
                    'players',
                    [
                        'test0001', 'test0002', 'test0003', 'test0004',
                        'test0005', 'test0006', 'test0007', 'test0008',
                    ],
                    function (doc) {
                        // nothing
                    }
                );
            } else {
                size += 1;

                core.alloc(output, [], doAlloc);
            }
        };

        core.init(8, 'modern', [], doAlloc);
    };

    test();
});
