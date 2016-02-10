'use strict';

var domain = require('domain');
var http = require('http'); // TODO: https?
var io = require('socket.io');

var config = require('./mese.config');
var util = require('./mese.util');
var db = require('./mese.db');
var game = require('./mese.game');
var report = require('./mese.report');
var web = require('./mese.web');

process.on('uncaughtException', function (e) {
    util.log('uncaught exception');
    util.log(e.stack || e);
});

var server = http.createServer(web.handler).listen(config.port);

util.log('server init ' + config.port);

db.init(function () {
    io(server).on('connection', function (socket) {
        util.log('connect ' + socket.conn.remoteAddress);

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
                    if (password === data.password) {
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
                    if (!subscribes) {
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

                gameStorage.staticGetMulti(function (map) {
                    if (!data.enabled || map) {
                        authStorage.staticGet('subscribes', function (subscribes) {
                            if (!subscribes) {
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
                    } else {
                        util.log('game not found ' + data.game);

                        socket.emit('subscribe_fail');
                    }
                });
            });

            socket.on('report', function (data) {
                // args: game

                if (
                    !util.verify(/^[A-Za-z0-9_ ]+$/, data.game)
                    || !util.verifyInt(data.period)
                    || !util.verifyNum(data.uid)
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

                gameStorage.staticGetMulti(function (map) {
                    if (map) {
                        if (map.uid == data.uid) {
                            return;
                        }

                        var player = undefined;

                        for (var i in map.players) {
                            if (map.players[i] === authName) {
                                player = parseInt(i);
                            }
                        }

                        report.print(
                            gameStorage, player,
                            function (result) {
                                result.game = data.game;
                                result.uid = map.uid;
                                result.players = map.players;

                                if (result.now_period != data.period) { // TODO: simplify
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
                            },
                            function (result) {
                                result.game = data.game;
                                result.uid = map.uid;
                                result.players = map.players;

                                if (result.now_period != data.period) { // TODO: simplify
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
                    } else {
                        util.log('game not found ' + data.game);

                        socket.emit('report_fail');
                    }
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

                gameStorage.staticGetMulti(function (map) {
                    if (!map) {
                        util.log('game not found ' + data.game);

                        return;
                    }

                    var player = undefined;

                    for (var i in map.players) {
                        if (map.players[i] === authName) {
                            player = parseInt(i);
                        }
                    }

                    if (player !== undefined) {
                        var afterSubmit = function (gameData) {
                            report.printEarly(
                                gameData, player,
                                function (result) {
                                    socket.emit(
                                        'report_early',
                                        result
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
                                util.log('submission declined ' + authName + ' ' + data.game);

                                socket.emit('submit_decline');
                                afterSubmit(gameData);
                            }
                        );
                    } else {
                        util.log('submission not allowed ' + authName + ' ' + data.game);

                        socket.emit('submit_fail');
                    }
                });
            });

            socket.on('disconnect', function () {
                util.log('disconnect ' + socket.conn.remoteAddress);
            });
        });
    });
});
