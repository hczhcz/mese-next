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

process.on('uncaughtException', function (e) {
    util.log('uncaught exception');
    util.log(e.stack || e);
});

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

util.log('server init ' + port)

db.init(function () {
    io(server).on('connection', function (socket) {
        util.log('socket ' + socket.conn.remoteAddress);

        var d = domain.create();

        d.on('error', function (e) {
            util.log(e.stack || e);
        });

        d.add(socket);

        d.run(function () {
            var authName = undefined;
            var authStorage = undefined;

            socket.on('login', function (data) {
                // args: name, password

                if (
                    !util.verify(/^[A-Za-z0-9_ ]+$/, data.name)
                    || !util.verify(/^.+$/, data.password)
                ) {
                    util.log('bad socket request');

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
                    util.log('bad socket request');

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
                    util.log('bad socket request');

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
                    || !util.verify(/^[A-Za-z0-9_ ]+$/, data.game)
                    || !util.verifyBool(data.enabled)
                ) {
                    util.log('bad socket request');

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
                    !util.verify(/^[A-Za-z0-9_ ]+$/, data.game)
                    || !util.verifyInt(data.period)
                ) {
                    util.log('bad socket request');

                    return;
                }

                if (authName) {
                    util.log('get report ' + authName + ' ' + data.game);
                } else {
                    util.log('get report ' + socket.conn.remoteAddress + ' ' + data.game);
                }

                var gameStorage = db.access('games', data.game);

                gameStorage.staticGet('players', function (players) {
                    if (players === undefined) {
                        util.log('wrong game');

                        return;
                    }

                    var player = undefined;

                    for (var i in players) {
                        if (players[i] === authName) {
                            player = parseInt(i);
                        }
                    }

                    gameStorage.staticGet('data', function (dataObj) {
                        var gameData = dataObj.buffer;

                        if (player !== undefined) {
                            // as player

                            core.printPlayer(
                                gameData,
                                player,
                                function (report) {
                                    var result = eval('(' + report + ')');
                                    result.game = data.game;
                                    result.players = players;

                                    if (result.now_period !== data.period) { // TODO: simplify
                                        socket.emit(
                                            'report_player',
                                            result
                                        );
                                    } else {
                                        socket.emit(
                                            'report_status',
                                            result.status
                                        );
                                    }
                                }
                            );
                        } else {
                            // as guest

                            core.printPublic(
                                gameData,
                                function (report) {
                                    var result = eval('(' + report + ')');
                                    result.game = data.game;
                                    result.players = players;

                                    if (result.now_period !== data.period) { // TODO: simplify
                                        socket.emit(
                                            'report_public',
                                            result
                                        );
                                    } else {
                                        socket.emit(
                                            'report_status',
                                            result.status
                                        );
                                    }
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
                    || !util.verify(/^[A-Za-z0-9_ ]+$/, data.game)
                    || !util.verifyInt(data.period)
                    || !util.verifyNum(data.price)
                    || !util.verifyInt(data.prod)
                    || !util.verifyNum(data.mk)
                    || !util.verifyNum(data.ci)
                    || !util.verifyNum(data.rd)
                ) {
                    util.log('bad socket request');

                    return;
                }

                util.log('submit ' + authName + ' ' + data.game);

                var gameStorage = db.access('games', data.game);

                gameStorage.staticGet('players', function (players) {
                    if (players === undefined) {
                        util.log('wrong game');

                        return;
                    }

                    var player = undefined;

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
                                    // socket.emit(
                                    //     'report_early',
                                    //     eval('(' + report + ')')
                                    // );
                                    try { // TODO: unexpected error
                                        socket.emit(
                                            'report_early',
                                            eval('(' + report + ')')
                                        );
                                    } catch (e) {
                                        console.log(report);

                                        throw e;
                                    }
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
});
