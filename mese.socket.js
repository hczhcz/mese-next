'use strict';

var config = require('./mese.config');
var util = require('./mese.util');
var db = require('./mese.db');
var game = require('./mese.game');
var report = require('./mese.report');

module.exports = function (socket) {
    util.domainRunCatched([socket], function () {
        util.log('connect ' + socket.conn.remoteAddress);

        var authName = undefined;
        var authStorage = undefined;
        var authSudo = false;

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

            storage.staticGetMulti(function (map) {
                // notice: map may exist before signing up
                if (!map || map.password === undefined) {
                    util.log('new user ' + data.name);

                    storage.staticSet(
                        'password', data.password,
                        function (doc) {
                            authName = data.name;
                            authStorage = storage;

                            socket.emit('login_new', {name: authName});

                            // notice: admin user should login again here
                        }
                    );
                } else if (map.password === data.password) {
                    authName = data.name;
                    authStorage = storage;

                    socket.emit('login_ok', {name: authName});

                    if (
                        data.name === config.adminName
                        && data.password === config.adminPassword
                    ) {
                        util.log('admin login');

                        authSudo = true;

                        socket.emit('admin_login');
                    }
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
                if (data.enabled && !map) {
                    util.log('game not found ' + data.game);

                    socket.emit('subscribe_fail');

                    return;
                }

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
                if (!map) {
                    util.log('game not found ' + data.game);

                    socket.emit('report_fail');

                    return;
                }

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
                    map.data.buffer /* MongoDB binary data */, player,
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
};
