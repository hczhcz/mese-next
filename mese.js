'use strict';

var port = 63000;

var fs = require('fs');
var domain = require('domain');
var http = require('http'); // TODO: https?
var io = require('socket.io');

var util = require('./mese.util');
var core = require('./mese.core');
var game = require('./mese.game');
var db = require('./mese.db');

var page = fs.readFileSync('./page.html');

var server = http.createServer(function (req, res) {
    var d = domain.create();

    d.on('error', function (e) {
        util.log(e);
        console.log(e.stack);
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
    io(server).on('connection', function (socket) {
        util.log('socket ' + socket.conn.remoteAddress);

        var d = domain.create();

        d.on('error', function (e) {
            util.log(e);
            console.log(e.stack);
        });

        d.add(socket);

        d.run(function () {
            var authName;
            var authPassword;
            var authStorage;

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
                    || !util.verify(/^[A-Za-z0-9_ ]+$/, data.game) // TODO
                    || !util.verifyInt(data.price)
                    || !util.verifyInt(data.prod)
                    || !util.verifyInt(data.mk)
                    || !util.verifyInt(data.ci)
                    || !util.verifyInt(data.rd)
                ) {
                    return;
                }

                util.log('submit ' + authName + ' ' + data.game);

                var gameStorage = db.access('games', data.game);

                gameStorage.staticGet('players', function (players) {
                    var player;

                    for (var i in players) {
                        if (players[i] === authName) {
                            player = i;
                        }
                    }

                    if (player !== undefined) {
                        var afterSubmit = function (gameData) {
                            core.printPlayerEarly(
                                gameData,
                                player,
                                function (output) {
                                    socket.emit(
                                        'report_early',
                                        eval('(' + output + ')')
                                    );
                                }
                            );
                        };

                        game.submit(
                            gameStorage, player,
                            data.price, data.prod, data.mk, data.ci, data.rd,
                            function (gameData) {
                                socket.emit('submit_ok');
                                afterSubmit(gameData);
                            },
                            function (gameData) {
                                socket.emit('submit_decline');
                                afterSubmit(gameData);
                            }
                        );
                    } else {
                        socket.emit('submit_fail');
                    }
                });
            });

            socket.on('password', function (data) {
                // password, newPassword

                if (
                    !authName
                    || !util.verify(/^.+$/, data.password)
                    || !util.verify(/^.+$/, data.newPassword)
                ) {
                    return;
                }

                util.log('change password ' + authName);

                if (data.password === authPassword) {
                    authStorage.staticSet(
                        'password', data.newPassword,
                        function (doc) {
                            authPassword = password;

                            socket.emit('password_ok');
                        }
                    );
                } else {
                    util.log('wrong password ' + authName);

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
