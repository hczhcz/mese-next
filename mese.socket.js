'use strict';

var io = require('socket.io');

var config = require('./mese.config');
var util = require('./mese.util');
var access = require('./mese.access');
var game = require('./mese.game');
var admin = require('./mese.admin');

var handler = function (socket) {
    util.domainRunCatched([socket], function () {
        util.log('connect ' + socket.conn.remoteAddress);

        var authUser = undefined;
        var authSudo = false;

        var userLog = function (info) {
            util.log('[' + (authUser || socket.conn.remoteAddress) + '] ' + info);
        };

        socket.on('login', function (data) {
            // args: user, password

            if (
                !util.verifierStr(/^[A-Za-z0-9_ ]+$/)(data.user)
                || !util.verifierStr(/^.+$/)(data.password)
            ) {
                userLog('bad socket request');

                return;
            }

            userLog('login ' + data.user);

            access.userAuth(data.user, function (password, setter) {
                if (password === undefined) {
                    setter(data.password, function () {
                        authUser = data.user;

                        userLog('new user');

                        socket.emit('login_new', authUser);

                        // notice: admin user should login again here
                    });

                    return true; // need setter
                } else if (password === data.password) {
                    authUser = data.user;

                    socket.emit('login_ok', authUser);

                    if (
                        data.user === config.adminUser
                        && data.password === config.adminPassword
                    ) {
                        authSudo = true;

                        userLog('admin auth');

                        socket.emit('admin_auth_ok');
                    }
                } else {
                    userLog('wrong password');

                    socket.emit('login_fail');
                }
            });
        });

        socket.on('password', function (data) {
            // args: password, newPassword

            if (
                authUser === undefined
                || !util.verifierStr(/^.+$/)(data.password)
                || !util.verifierStr(/^.+$/)(data.newPassword)
            ) {
                userLog('bad socket request');

                return;
            }

            userLog('change password');

            access.userAuth(authUser, function (password, setter) {
                if (password === data.password) {
                    setter(data.newPassword, function () {
                        socket.emit('password_ok');
                    });

                    return true; // need setter
                } else {
                    userLog('wrong password');

                    socket.emit('password_fail');
                }
            });
        });

        socket.on('list', function (data) {
            // args: (nothing)

            if (
                authUser === undefined
            ) {
                userLog('bad socket request');

                return;
            }

            userLog('list');

            access.user(
                authUser,
                function (subscribes) {
                    socket.emit('subscribe_data', subscribes);
                },
                function () {
                    userLog('list not found');

                    socket.emit('subscribe_fail_list');
                }
            );
        });

        socket.on('subscribe', function (data) {
            // args: game, enabled

            if (
                authUser === undefined
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

            var doSubscribe = function () {
                access.userSubscribe(
                    authUser, data.game, data.enabled,
                    function (subscribes) {
                        socket.emit('subscribe_data', subscribes);
                    },
                    function () {
                        userLog('subscription not allowed');

                        socket.emit('subscribe_fail_player');
                    }
                );
            };

            access.game(
                data.game,
                function (uid, players, gameData) {
                    doSubscribe();
                },
                function () {
                    if (data.enabled) {
                        userLog('game not found ' + data.game);

                        socket.emit('subscribe_fail_game');
                    } else {
                        doSubscribe();
                    }
                }
            );
        });

        socket.on('report', function (data) {
            // args: game, period, uid

            if (
                !util.verifierStr(/^[A-Za-z0-9_ ]+$/)(data.game)
                || !util.verifyNum(data.uid)
            ) {
                userLog('bad socket request');

                return;
            }

            userLog('get report ' + data.game);

            access.game(
                data.game,
                function (uid, players, gameData) {
                    if (uid == data.uid) {
                        return;
                    }

                    var player = undefined;

                    for (var i in players) {
                        if (players[i] === authUser) {
                            player = parseInt(i);
                            break;
                        }
                    }

                    game.print(
                        gameData, player,
                        function (report) {
                            report.game = data.game;
                            report.uid = uid;
                            report.players = players;

                            socket.emit('report_player', report);
                        },
                        function (report) {
                            report.game = data.game;
                            report.uid = uid;
                            report.players = players;

                            socket.emit('report_public', report);
                        }
                    );
                },
                function () {
                    userLog('game not found ' + data.game);

                    socket.emit('report_fail');
                }
            );
        });

        socket.on('submit', function (data) {
            // args: game, period, price, prod, mk, ci, rd

            if (
                authUser === undefined
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

            access.gameAction(
                data.game,
                function (players, oldData, setter) {
                    var player = undefined;

                    for (var i in players) {
                        if (players[i] === authUser) {
                            player = parseInt(i);
                            break;
                        }
                    }

                    if (player !== undefined) {
                        var afterClose = function (gameData, snapshot) {
                            setter(undefined, gameData, function () {
                                // TODO: push updates?
                            });
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

                        return true; // need setter
                    } else {
                        userLog('submission not allowed ' + data.game);

                        socket.emit('submit_fail_player');
                    }
                },
                function (setter) {
                    userLog('game not found ' + data.game);

                    socket.emit('submit_fail_game');
                }
            );
        });

        socket.on('admin_message', function (data) {
            // args: message

            if (
                !authSudo
                || !util.verifierStr(/^.+$/)(data.message) // TODO: max length?
            ) {
                userLog('bad socket request');

                return;
            }

            userLog('admin message ' + data.message);

            socket.server.emit('message', data.message);
        });

        socket.on('admin_login', function (data) {
            // args: user

            if (
                !authSudo
                || !util.verifierStr(/^[A-Za-z0-9_ ]+$/)(data.user)
            ) {
                userLog('bad socket request');

                return;
            }

            userLog('admin login ' + data.user);

            authUser = data.user;

            socket.emit('login_ok', authUser);
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

            access.userAuth(authUser, function (password, setter) {
                setter(data.newPassword, function () {
                    socket.emit('password_ok');
                });

                return true; // need setter
            });
        });

        socket.on('admin_list', function (data) {
            // args: (nothing)

            if (
                !authSudo
            ) {
                userLog('bad socket request');

                return;
            }

            userLog('admin list');

            access.users(function (userList) {
                access.games(function (gameList) {
                    socket.emit('admin_list_data', {users: userList, games: gameList});
                });
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

            access.game(
                data.game,
                function (uid, players, gameData) {
                    admin.print(
                        gameData,
                        function (report) {
                            socket.emit('admin_report_data', report);
                        }
                    );
                },
                function () {
                    userLog('game not found ' + data.game);

                    socket.emit('admin_report_fail');
                }
            );
        });

        socket.on('admin_transfer', function (data) {
            // args: game, user

            if (
                !authSudo
                || !util.verifierStr(/^[A-Za-z0-9_ ]+$/)(data.game)
                || !util.verifierStr(/^[A-Za-z0-9_ ]+$/)(data.user)
            ) {
                userLog('bad socket request');

                return;
            }

            userLog('admin transfer game ' + data.game + ' ' + data.user);

            access.gameAction(
                data.game,
                function (players, oldData, setter) {
                    var player = undefined;

                    for (var i in players) {
                        if (players[i] === authUser) {
                            player = parseInt(i);
                            break;
                        }
                    }

                    if (player !== undefined) {
                        players[player] = data.user;

                        // store data
                        setter(players, undefined, function () {
                            socket.emit('admin_transfer_ok');
                        });

                        return true; // need setter
                    } else {
                        userLog('transferring not allowed ' + data.game);

                        socket.emit('admin_transfer_fail_player');
                    }
                },
                function (setter) {
                    userLog('game not found ' + data.game);

                    socket.emit('admin_transfer_fail_game');
                }
            );
        });

        socket.on('admin_init', function (data) {
            // args: game, players, preset, settings

            if (
                !authSudo
                || !util.verifierStr(/^[A-Za-z0-9_ ]+$/)(data.game)
                || !util.verifierArr(util.verifierStr(/^[A-Za-z0-9_ ]+$/))(data.players)
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
            userLog('alloc ' + data.settings.length + 'pd');

            if (data.players.length == 0 || data.players.length > config.coreMaxPlayer) {
                userLog('player count not supported');

                socket.emit('admin_init_fail_number');
            }

            access.gameAction(
                data.game,
                function (players, oldData, setter) {
                    userLog('game exists ' + data.game);

                    socket.emit('admin_init_fail_game');
                },
                function (setter) {
                    admin.init(
                        data.players.length, data.preset, data.settings,
                        function (gameData) {
                            setter(data.players, gameData, function () {
                                for (var i in data.players) {
                                    access.userSubscribe(
                                        data.players[i], data.game, true,
                                        function (subscribes) {
                                            userLog('invited ' + data.players[i]);
                                        },
                                        function () {
                                            userLog('invition not allowed ' + data.players[i]);

                                            socket.emit('admin_init_fail_invite', data.players[i]);
                                        }
                                    );
                                }

                                socket.emit('admin_init_ok');
                            });
                        }
                    );

                    return true; // need setter
                }
            );
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
            userLog('alloc ' + data.settings.length + 'pd');

            access.gameAction(
                data.game,
                function (players, oldData, setter) {
                    admin.alloc(
                        oldData, data.settings,
                        function (gameData) {
                            setter(undefined, gameData, function () {
                                socket.emit('admin_alloc_ok');
                            });
                        }
                    );

                    return true; // need setter
                },
                function (setter) {
                    userLog('game not found ' + data.game);

                    socket.emit('admin_alloc_fail_game');
                }
            );
        });

        // socket.on('admin_revent', function (data) { // not implemented
        // });

        socket.on('error', function (err) {
            util.log('socket error');
            util.err(err);
        });

        socket.on('disconnect', function () {
            util.log('disconnect ' + socket.conn.remoteAddress);
        });
    });
};

module.exports = function (server) {
    io(server).on('connection', handler);
};
