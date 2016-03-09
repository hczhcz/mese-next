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

        socket.on('login', function (args) {
            // args: user, password

            if (
                !util.verifierStr(/^[A-Za-z0-9_ ]+$/)(args.user)
                || !util.verifierStr(/^.+$/)(args.password)
            ) {
                userLog('bad socket request');

                return;
            }

            userLog('login ' + args.user);

            access.userAuth(args.user, function (password, setter) {
                if (password === undefined) {
                    setter(args.password, function () {
                        authUser = args.user;

                        userLog('new user');

                        socket.emit('login_new', authUser);

                        // notice: admin user should login again here
                    });

                    return true; // need setter
                } else if (password === args.password) {
                    authUser = args.user;

                    socket.emit('login_ok', authUser);

                    if (
                        args.user === config.adminUser
                        && args.password === config.adminPassword
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

        socket.on('password', function (args) {
            // args: password, newPassword

            if (
                authUser === undefined
                || !util.verifierStr(/^.+$/)(args.password)
                || !util.verifierStr(/^.+$/)(args.newPassword)
            ) {
                userLog('bad socket request');

                return;
            }

            userLog('change password');

            access.userAuth(authUser, function (password, setter) {
                if (password === args.password) {
                    setter(args.newPassword, function () {
                        socket.emit('password_ok');
                    });

                    return true; // need setter
                } else {
                    userLog('wrong password');

                    socket.emit('password_fail');
                }
            });
        });

        socket.on('list', function (args) {
            // args: (nothing)

            if (
                authUser === undefined
            ) {
                userLog('bad socket request');

                return;
            }

            userLog('list games');

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

        socket.on('subscribe', function (args) {
            // args: game, enabled

            if (
                authUser === undefined
                || !util.verifierStr(/^[A-Za-z0-9_ ]+$/)(args.game)
                || !util.verifyBool(args.enabled)
            ) {
                userLog('bad socket request');

                return;
            }

            if (args.enabled) {
                userLog('subscribe game ' + args.game);
            } else {
                userLog('unsubscribe game ' + args.game);
            }

            var doSubscribe = function () {
                access.userSubscribe(
                    authUser, args.game, args.enabled,
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
                args.game,
                function (uid, players, gameData) {
                    doSubscribe();
                },
                function () {
                    if (args.enabled) {
                        userLog('game not found ' + args.game);

                        socket.emit('subscribe_fail_game');
                    } else {
                        doSubscribe();
                    }
                }
            );
        });

        socket.on('report', function (args) {
            // args: game, period, uid

            if (
                !util.verifierStr(/^[A-Za-z0-9_ ]+$/)(args.game)
                || !util.verifyNum(args.uid)
            ) {
                userLog('bad socket request');

                return;
            }

            userLog('get report ' + args.game);

            access.game(
                args.game,
                function (uid, players, gameData) {
                    if (uid == args.uid) {
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
                            report.game = args.game;
                            report.uid = uid;
                            report.players = players;

                            socket.emit('report_player', report);
                        },
                        function (report) {
                            report.game = args.game;
                            report.uid = uid;
                            report.players = players;

                            socket.emit('report_public', report);
                        }
                    );
                },
                function () {
                    userLog('game not found ' + args.game);

                    socket.emit('report_fail');
                }
            );
        });

        socket.on('submit', function (args) {
            // args: game, period, price, prod, mk, ci, rd

            if (
                authUser === undefined
                || !util.verifierStr(/^[A-Za-z0-9_ ]+$/)(args.game)
                || !util.verifyInt(args.period)
                || !util.verifyNum(args.price)
                || !util.verifyInt(args.prod)
                || !util.verifyNum(args.mk)
                || !util.verifyNum(args.ci)
                || !util.verifyNum(args.rd)
            ) {
                userLog('bad socket request');

                return;
            }

            userLog('submit ' + args.game);

            access.gameAction(
                args.game,
                function (players, oldData, setter, next) {
                    var player = undefined;

                    for (var i in players) {
                        if (players[i] === authUser) {
                            player = parseInt(i);
                            break;
                        }
                    }

                    if (player !== undefined) {
                        game.submit(
                            oldData, player, args.period,
                            args.price, args.prod, args.mk, args.ci, args.rd,
                            function (accepted, closed, gameData) {
                                if (accepted) {
                                    if (closed) {
                                        userLog('submission accepted and peroid closed');
                                    } else {
                                        userLog('submission accepted');
                                    }

                                    setter(undefined, gameData, function () {
                                        // TODO: push updates?
                                    });

                                    socket.emit('submit_ok');
                                } else {
                                    userLog('submission declined ' + args.game);

                                    next(); // manually finish

                                    socket.emit('submit_decline');
                                }
                            },
                            function (report) {
                                socket.emit('report_early', report);
                            }
                        );

                        return true; // need setter() or next()
                    } else {
                        userLog('submission not allowed ' + args.game);

                        socket.emit('submit_fail_player');
                    }
                },
                function (setter) {
                    userLog('game not found ' + args.game);

                    socket.emit('submit_fail_game');
                }
            );
        });

        socket.on('admin_message', function (args) {
            // args: message

            if (
                !authSudo
                || !util.verifierText()(args.message)
            ) {
                userLog('bad socket request');

                return;
            }

            userLog('admin message ' + args.message);

            socket.server.emit('message', args.message);
        });

        socket.on('admin_login', function (args) {
            // args: user

            if (
                !authSudo
                || !util.verifierStr(/^[A-Za-z0-9_ ]+$/)(args.user)
            ) {
                userLog('bad socket request');

                return;
            }

            userLog('admin login ' + args.user);

            authUser = args.user;

            socket.emit('login_ok', authUser);
        });

        socket.on('admin_password', function (args) {
            // args: newPassword

            if (
                !authSudo
                || !util.verifierStr(/^.+$/)(args.newPassword)
            ) {
                userLog('bad socket request');

                return;
            }

            userLog('admin change password');

            access.userAuth(authUser, function (password, setter) {
                setter(args.newPassword, function () {
                    socket.emit('password_ok');
                });

                return true; // need setter
            });
        });

        socket.on('admin_list', function (args) {
            // args: (nothing)

            if (
                !authSudo
            ) {
                userLog('bad socket request');

                return;
            }

            userLog('admin list all');

            access.users(function (userList) {
                access.games(function (gameList) {
                    socket.emit('admin_list_data', {users: userList, games: gameList});
                });
            });
        });

        socket.on('admin_report', function (args) {
            // args: game

            if (
                !authSudo
                || !util.verifierStr(/^[A-Za-z0-9_ ]+$/)(args.game)
            ) {
                userLog('bad socket request');

                return;
            }

            userLog('admin get report ' + args.game);

            access.game(
                args.game,
                function (uid, players, gameData) {
                    admin.print(
                        gameData,
                        function (report) {
                            socket.emit('admin_report_data', report);
                        }
                    );
                },
                function () {
                    userLog('game not found ' + args.game);

                    socket.emit('admin_report_fail');
                }
            );
        });

        socket.on('admin_transfer', function (args) {
            // args: game, user

            if (
                !authSudo
                || !util.verifierStr(/^[A-Za-z0-9_ ]+$/)(args.game)
                || !util.verifierStr(/^[A-Za-z0-9_ ]+$/)(args.user)
            ) {
                userLog('bad socket request');

                return;
            }

            userLog('admin transfer game ' + args.game + ' ' + args.user);

            access.gameAction(
                args.game,
                function (players, oldData, setter) {
                    var player = undefined;

                    for (var i in players) {
                        if (players[i] === authUser) {
                            player = parseInt(i);
                            break;
                        }
                    }

                    if (player !== undefined) {
                        players[player] = args.user;

                        // store data
                        setter(players, undefined, function () {
                            socket.emit('admin_transfer_ok');
                        });

                        return true; // need setter
                    } else {
                        userLog('transferring not allowed ' + args.game);

                        socket.emit('admin_transfer_fail_player');
                    }
                },
                function (setter) {
                    userLog('game not found ' + args.game);

                    socket.emit('admin_transfer_fail_game');
                }
            );
        });

        socket.on('admin_init', function (args) {
            // args: game, players, preset, settings

            if (
                !authSudo
                || !util.verifierStr(/^[A-Za-z0-9_ ]+$/)(args.game)
                || !util.verifierArr(util.verifierStr(/^[A-Za-z0-9_ ]+$/))(args.players)
                || !util.verifierStr(/^[A-Za-z0-9_]+$/)(args.preset)
                || !util.verifierArr(
                        util.verifierObj(
                            util.verifierStr(/^[A-Za-z0-9_]+$/),
                            util.verifyNum
                        )
                    )(args.settings)
            ) {
                userLog('bad socket request');

                return;
            }

            userLog('admin init game ' + args.game + ' ' + args.preset);
            userLog('allocated ' + args.settings.length + 'pd');

            if (args.players.length == 0 || args.players.length > config.coreMaxPlayer) {
                userLog('player count not supported');

                socket.emit('admin_init_fail_number');
            }

            access.gameAction(
                args.game,
                function (players, oldData, setter) {
                    userLog('game exists ' + args.game);

                    socket.emit('admin_init_fail_game');
                },
                function (setter) {
                    admin.init(
                        args.players.length, args.preset, args.settings,
                        function (gameData) {
                            setter(args.players, gameData, function () {
                                for (var i in args.players) {
                                    access.userSubscribe(
                                        args.players[i], args.game, true,
                                        function (subscribes) {
                                            userLog('invited ' + args.players[i]);
                                        },
                                        function () {
                                            userLog('invition not allowed ' + args.players[i]);

                                            socket.emit('admin_init_fail_invite', args.players[i]);
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

        socket.on('admin_alloc', function (args) {
            // args: game, settings

            if (
                !authSudo
                || !util.verifierStr(/^[A-Za-z0-9_ ]+$/)(args.game)
                || !util.verifierArr(
                        util.verifierObj(
                            util.verifierStr(/^[A-Za-z0-9_]+$/),
                            util.verifyNum
                        )
                    )(args.settings)
            ) {
                userLog('bad socket request');

                return;
            }

            userLog('admin alloc period ' + args.game);
            userLog('allocated ' + args.settings.length + 'pd');

            access.gameAction(
                args.game,
                function (players, oldData, setter) {
                    admin.alloc(
                        oldData, args.settings,
                        function (gameData) {
                            setter(undefined, gameData, function () {
                                socket.emit('admin_alloc_ok');
                            });
                        }
                    );

                    return true; // need setter
                },
                function (setter) {
                    userLog('game not found ' + args.game);

                    socket.emit('admin_alloc_fail_game');
                }
            );
        });

        // socket.on('admin_revent', function (args) { // not implemented
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
