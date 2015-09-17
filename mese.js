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
        util.log(e.stack || e);
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
            util.log(e.stack || e);
        });

        d.add(socket);

        d.run(function () {
            var authName;
            var authStorage;

            socket.on('login', function (data) {
                // args: name, password

                if (
                    !util.verify(/^[A-Za-z0-9_ ]+$/, data.name)
                    || !util.verify(/^.+$/, data.password)
                ) {
                    return;
                }

                util.log('login ' + socket.conn.remoteAddress + ' ' + data.name);

                var storage = db.access('users', data.name);

                storage.staticGet('password', function (password) {
                    if (password === undefined) {
                        util.log('new user ' + data.name);

                        storage.staticSet(
                            'password', data.password,
                            function (doc) {
                                authName = data.name;
                                authStorage = storage;

                                socket.emit('login_new', {name: authName});
                            }
                        );
                    } else if (password === data.password) {
                        authName = data.name;
                        authStorage = storage;

                        socket.emit('login_ok', {name: authName});
                    } else {
                        util.log('wrong password ' + data.name);

                        socket.emit('login_fail');
                    }
                });
            });

            socket.on('password', function (data) {
                // args: password, newPassword

                if (
                    !authName
                    || !util.verify(/^.+$/, data.password)
                    || !util.verify(/^.+$/, data.newPassword)
                ) {
                    return;
                }

                util.log('change password ' + authName);

                authStorage.staticGet('password', function (password) {
                    if (data.password === password) {
                        authStorage.staticSet(
                            'password', data.newPassword,
                            function (doc) {
                                socket.emit('password_ok');
                            }
                        );
                    } else {
                        util.log('wrong password ' + authName);

                        socket.emit('password_fail');
                    }
                });
            });

            socket.on('list', function (data) {
                // args: (nothing)

                if (
                    !authName
                ) {
                    return;
                }

                util.log('list ' + authName);

                authStorage.staticGet('subscribes', function (subscribes) {
                    if (subscribes === undefined) {
                        subscribes = {};
                    }

                    socket.emit(
                        'subscribe_list',
                        subscribes
                    );
                });
            });

            socket.on('subscribe', function (data) {
                // args: game, enabled

                if (
                    !authName
                    || !util.verify(/^[A-Za-z0-9_ ]+$/, data.game) // TODO
                    || !util.verifyBool(data.enabled)
                ) {
                    return;
                }

                if (data.enabled) {
                    util.log('subscribe ' + authName + ' ' + data.game);
                } else {
                    util.log('unsubscribe ' + authName + ' ' + data.game);
                }

                var gameStorage = db.access('games', data.game);

                gameStorage.staticGet('players', function (players) {
                    if (data.enabled && players === undefined) {
                        util.log('wrong game');

                        return;
                    }

                    authStorage.staticGet('subscribes', function (subscribes) {
                        if (subscribes === undefined) {
                            subscribes = {};
                        }

                        subscribes[data.game] = data.enabled;

                        authStorage.staticSet(
                            'subscribes', subscribes,
                            function (doc) {
                                socket.emit(
                                    'subscribe_update',
                                    subscribes
                                );
                            }
                        );
                    });
                });
            });

            socket.on('report', function (data) {
                // args: game

                if (
                    !util.verify(/^[A-Za-z0-9_ ]+$/, data.game) // TODO
                ) {
                    return;
                }

                if (authName) {
                    util.log('get report ' + authName + ' ' + data.game);
                } else {
                    util.log('get report ' + socket.conn.remoteAddress + ' ' + data.game);
                }

                var gameName = data.game;
                var gameStorage = db.access('games', gameName);

                gameStorage.staticGet('players', function (players) {
                    if (players === undefined) {
                        util.log('wrong game');

                        return;
                    }

                    var player;

                    for (var i in players) {
                        if (players[i] === authName) {
                            player = parseInt(i);
                        }
                    }

                    gameStorage.staticGet('data', function (data) {
                        var gameData = data.buffer;

                        if (player !== undefined) {
                            // as player

                            core.printPlayer(
                                gameData,
                                player,
                                function (report) {
                                    var result = eval('(' + report + ')');
                                    result.game = gameName;
                                    result.players = players;

                                    socket.emit(
                                        'report_player',
                                        result
                                    );
                                }
                            );
                        } else {
                            // as guest

                            core.printPublic(
                                gameData,
                                function (report) {
                                    var result = eval('(' + report + ')');
                                    result.game = gameName;
                                    result.players = players;

                                    socket.emit(
                                        'report_public',
                                        result
                                    );
                                }
                            );
                        }
                    });
                });
            });

            socket.on('submit', function (data) {
                // args: game, period, price, prod, mk, ci, rd

                if (
                    !authName
                    || !util.verify(/^[A-Za-z0-9_ ]+$/, data.game) // TODO
                    || !util.verifyInt(data.period)
                    || !util.verifyNum(data.price)
                    || !util.verifyInt(data.prod)
                    || !util.verifyNum(data.mk)
                    || !util.verifyNum(data.ci)
                    || !util.verifyNum(data.rd)
                ) {
                    return;
                }

                util.log('submit ' + authName + ' ' + data.game);

                var gameStorage = db.access('games', data.game);

                gameStorage.staticGet('players', function (players) {
                    if (players === undefined) {
                        util.log('wrong game');

                        return;
                    }

                    var player;

                    for (var i in players) {
                        if (players[i] === authName) {
                            player = parseInt(i);
                        }
                    }

                    if (player !== undefined) {
                        var afterSubmit = function (gameData) {
                            core.printPlayerEarly(
                                gameData,
                                player,
                                function (report) {
                                    socket.emit(
                                        'report_early',
                                        eval('(' + report + ')')
                                    );
                                }
                            );
                        };

                        game.submit(
                            gameStorage, player, data.period,
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
        });
    });

    var initGame = function (name, players) {
        var size = 0;

        var doAlloc = function (gameData) {
            if (size >= 7) {
                var gameStorage = db.access('games', name);

                gameStorage.staticSet(
                    'data', gameData,
                    function (doc) {
                        // nothing
                    }
                );
                gameStorage.staticSet(
                    'players', players,
                    function (doc) {
                        // nothing
                    }
                );
            } else {
                size += 1;

                core.alloc(gameData, [], doAlloc);
            }
        };

        core.init(players.length, 'modern', [], doAlloc);
    };

    // initGame(
    //     'test',
    //     [
    //         'test0001', 'test0002', 'test0003', 'test0004',
    //         'test0005', 'test0006', 'test0007', 'test0008',
    //     ]
    // );
});
