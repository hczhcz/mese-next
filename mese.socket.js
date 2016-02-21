'use strict';

var config = require('./mese.config');
var util = require('./mese.util');
var db = require('./mese.db');
var game = require('./mese.game');
var admin = require('./mese.admin');

module.exports = function (socket) {
    util.domainRunCatched([socket], function () {
        util.log('connect ' + socket.conn.remoteAddress);

        var authName = undefined;
        var authSudo = false;

        var userLog = function (info) {
            util.log('[' + (authName || socket.conn.remoteAddress) + '] ' + info);
        };

        socket.on('login', function (data) {
            // args: name, password

            if (
                !util.verifierStr(/^[A-Za-z0-9_ ]+$/)(data.name)
                || !util.verifierStr(/^.+$/)(data.password)
            ) {
                userLog('bad socket request');

                return;
            }

            userLog('login ' + data.name);

            db.update('users', data.name, function (doc, setter, next) {
                // notice: doc may exist before signing up
                if (!doc || doc.password === undefined) {
                    setter(
                        {password: data.password},
                        function (doc) {
                            authName = data.name;

                            userLog('new user');

                            socket.emit('login_new', {name: authName});
                            next();

                            // notice: admin user should login again here
                        }
                    );
                } else if (doc.password === data.password) {
                    authName = data.name;

                    socket.emit('login_ok', {name: authName});
                    next();

                    if (
                        data.name === config.adminName
                        && data.password === config.adminPassword
                    ) {
                        authSudo = true;

                        userLog('admin auth');

                        socket.emit('admin_auth_ok');
                    }
                } else {
                    userLog('wrong password');

                    socket.emit('login_fail');
                    next();
                }
            });
        });

        socket.on('password', function (data) {
            // args: password, newPassword

            if (
                !authName
                || !util.verifierStr(/^.+$/)(data.password)
                || !util.verifierStr(/^.+$/)(data.newPassword)
            ) {
                userLog('bad socket request');

                return;
            }

            userLog('change password');

            db.update('users', authName, function (doc, setter, next) {
                if (doc.password === data.password) {
                    setter(
                        {password: data.newPassword},
                        function (doc) {
                            socket.emit('password_ok');
                            next();
                        }
                    );
                } else {
                    userLog('wrong password');

                    socket.emit('password_fail');
                    next();
                }
            });
        });

        socket.on('list', function (data) {
            // args: (nothing)

            if (
                !authName
            ) {
                userLog('bad socket request');

                return;
            }

            userLog('list');

            db.get('users', authName, function (doc) {
                socket.emit('subscribe_list', doc.subscribes || {});
            });
        });

        socket.on('subscribe', function (data) {
            // args: game, enabled

            if (
                !authName
                || !util.verifierStr(/^[A-Za-z0-9_ ]+$/)(data.game)
                || !util.verifyBool(data.enabled)
            ) {
                userLog('bad socket request');

                return;
            }

            if (data.enabled) {
                userLog('subscribe ' + data.game);
            } else {
                userLog('unsubscribe ' + data.game);
            }

            db.get('games', data.game, function (doc) {
                if (data.enabled && !doc) {
                    userLog('game not found ' + data.game);

                    socket.emit('subscribe_fail');

                    return;
                }

                db.update('users', authName, function (doc, setter, next) {
                    var subscribes = doc.subscribes || {};

                    subscribes[data.game] = data.enabled;

                    setter(
                        {subscribes: subscribes},
                        function (doc) {
                            socket.emit('subscribe_update', subscribes);
                            next();
                        }
                    );
                });
            });
        });

        socket.on('report', function (data) {
            // args: game, period, uid

            if (
                !util.verifierStr(/^[A-Za-z0-9_ ]+$/)(data.game)
                || !util.verifyInt(data.period)
                || !util.verifyNum(data.uid)
            ) {
                userLog('bad socket request');

                return;
            }

            userLog('get report ' + data.game);

            db.get('games', data.game, function (doc) {
                if (!doc) {
                    userLog('game not found ' + data.game);

                    socket.emit('report_fail');

                    return;
                }

                if (doc.uid == data.uid) {
                    return;
                }

                var player = undefined;

                for (var i in doc.players) {
                    if (doc.players[i] === authName) {
                        player = parseInt(i);
                        break;
                    }
                }

                game.print(
                    doc.data.buffer /* MongoDB binary data */, player,
                    function (report) {
                        report.game = data.game;
                        report.uid = doc.uid;
                        report.players = doc.players;

                        if (report.now_period != data.period) { // TODO: simplify
                            socket.emit('report_player', report);
                        } else {
                            socket.emit('report_status', report.status);
                        }
                    },
                    function (report) {
                        report.game = data.game;
                        report.uid = doc.uid;
                        report.players = doc.players;

                        if (report.now_period != data.period) { // TODO: simplify
                            socket.emit('report_public', report);
                        } else {
                            socket.emit('report_status', report.status);
                        }
                    }
                );
            });
        });

        socket.on('submit', function (data) {
            // args: game, period, price, prod, mk, ci, rd

            if (
                !authName
                || !util.verifierStr(/^[A-Za-z0-9_ ]+$/)(data.game)
                || !util.verifyInt(data.period)
                || !util.verifyNum(data.price)
                || !util.verifyInt(data.prod)
                || !util.verifyNum(data.mk)
                || !util.verifyNum(data.ci)
                || !util.verifyNum(data.rd)
            ) {
                userLog('bad socket request');

                return;
            }

            userLog('submit ' + data.game);

            db.update('games', data.game, function (doc, setter, next) {
                if (!doc) {
                    userLog('game not found ' + data.game);

                    socket.emit('submit_fail_game');
                    next();

                    return;
                }

                var player = undefined;

                for (var i in doc.players) {
                    if (doc.players[i] === authName) {
                        player = parseInt(i);
                        break;
                    }
                }

                if (player !== undefined) {
                    var oldData = doc.data.buffer; // MongoDB binary data

                    var afterClose = function (gameData, snapshot) {
                        if (!gameData || gameData.length != oldData.length) {
                            throw Error('data broken');
                        }

                        // generate an unique id (assumed unique)
                        var uid = Number(new Date());

                        // store data
                        setter(
                            {
                                uid: uid,
                                data: gameData,
                            },
                            function (doc) {
                                // TODO: push updates?
                                next();
                            }
                        );

                        if (snapshot) {
                            var diff = {};
                            diff['data_' + uid] = gameData;

                            // store snapshot
                            setter(
                                diff,
                                function (doc) {
                                    // nothing
                                }
                            );
                        }
                    };

                    game.submit(
                        oldData, player, data.period,
                        data.price, data.prod, data.mk, data.ci, data.rd,
                        function (gameData) {
                            socket.emit('submit_ok');
                        },
                        function (gameData) {
                            userLog('submission declined ' + data.game);

                            socket.emit('submit_decline');
                        },
                        function (report) {
                            socket.emit('report_early', report);
                        },
                        function (gameData) {
                            afterClose(gameData, true);
                        },
                        function (gameData) {
                            afterClose(gameData, false);
                        }
                    );
                } else {
                    userLog('submission not allowed ' + data.game);

                    socket.emit('submit_fail_player');
                    next();
                }
            });
        });

        socket.on('admin_login', function (data) {
            // args: name

            if (
                !authSudo
                || !util.verifierStr(/^[A-Za-z0-9_ ]+$/)(data.name)
            ) {
                userLog('bad socket request');

                return;
            }

            userLog('admin login ' + data.name);

            authName = data.name;

            // socket.emit('admin_login_ok', {name: authName});　// TODO
            socket.emit('login_ok', {name: authName});
        });

        socket.on('admin_password', function (data) {
            // args: newPassword

            if (
                !authSudo
                || !util.verifierStr(/^.+$/)(data.newPassword)
            ) {
                userLog('bad socket request');

                return;
            }

            userLog('admin change password');

            db.update('users', authName, function (doc, setter, next) {
                setter(
                    {password: data.newPassword},
                    function (doc) {
                        // socket.emit('admin_password_ok');　// TODO
                        socket.emit('password_ok');
                        next();
                    }
                );
            });
        });

        socket.on('admin_report', function (data) {
            // args: game

            if (
                !authSudo
                || !util.verifierStr(/^[A-Za-z0-9_ ]+$/)(data.game)
            ) {
                userLog('bad socket request');

                return;
            }

            userLog('admin get report ' + data.game);

            admin.print(
                gameData,
                function (report) {
                    socket.emit('admin_report', report);
                }
            );
        });

        socket.on('admin_transfer', function (data) {
            // args: game, name

            if (
                !authSudo
                || !util.verifierStr(/^[A-Za-z0-9_ ]+$/)(data.game)
                || !util.verifierStr(/^[A-Za-z0-9_ ]+$/)(data.name)
            ) {
                userLog('bad socket request');

                return;
            }

            userLog('admin transfer game ' + data.game + ' ' + data.name);

            db.update('games', data.game, function (doc, setter, next) {
                if (!doc) {
                    userLog('game not found ' + data.game);

                    socket.emit('admin_error');
                    next();

                    return;
                }

                var player = undefined;

                for (var i in doc.players) {
                    if (doc.players[i] === authName) {
                        player = parseInt(i);
                        break;
                    }
                }

                if (player !== undefined) {
                    // generate an unique id (assumed unique)
                    var uid = Number(new Date());

                    doc.players[player] = data.name;

                    // store data
                    setter(
                        {
                            uid: uid,
                            players: doc.players,
                        },
                        function (doc) {
                            // socket.emit('admin_ok'); // TODO
                            next();
                        }
                    );
                } else {
                    socket.emit('admin_error');
                    next();
                }
            });
        });

        socket.on('admin_init', function (data) {
            // args: game, players, preset, settings

            if (
                !authSudo
                || !util.verifierStr(/^[A-Za-z0-9_ ]+$/)(data.game)
                || !util.verifierArr(util.verifierStr(/^[A-Za-z0-9_ ]+$/))(data.players)
                || data.players.length == 0 // special condition
                || !util.verifierStr(/^[A-Za-z0-9_]+$/)(data.preset)
                || !util.verifierArr(
                        util.verifierObj(
                            util.verifierStr(/^[A-Za-z0-9_]+$/),
                            util.verifyNum
                        )
                    )(data.settings)
            ) {
                userLog('bad socket request');

                return;
            }

            userLog('admin create game ' + data.game + ' ' + data.preset);

            // TODO
        });

        socket.on('admin_alloc', function (data) {
            // args: game, settings

            if (
                !authSudo
                || !util.verifierStr(/^[A-Za-z0-9_ ]+$/)(data.game)
                || !util.verifierArr(
                        util.verifierObj(
                            util.verifierStr(/^[A-Za-z0-9_]+$/),
                            util.verifyNum
                        )
                    )(data.settings)
            ) {
                userLog('bad socket request');

                return;
            }

            userLog('admin alloc period ' + data.game);

            // TODO
        });

        // socket.on('admin_revent', function (data) { // not implemented
        // });

        socket.on('disconnect', function () {
            util.log('disconnect ' + socket.conn.remoteAddress);
        });
    });
};
