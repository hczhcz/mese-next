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

        var session = {};

        session.user = undefined;
        session.sudo = false;
        session.log = function (info) {
            util.log('[' + (session.user || socket.conn.remoteAddress) + '] ' + info);
        };

        socket.on('login', function (args) {
            // args: user, password

            if (
                !util.verifierStr(/^[A-Za-z0-9_ ]+$/)(args.user)
                || !util.verifierStr(/^.+$/)(args.password)
            ) {
                session.log('bad socket request');

                return;
            }

            session.log('login ' + args.user);

            access.userAuth(args.user, function (password, setter) {
                if (password === undefined) {
                    setter(args.password, function () {
                        session.user = args.user;

                        session.log('new user');

                        socket.emit('login_new', session.user);

                        // notice: admin user should login again here
                    });

                    return true; // need setter
                } else if (password === args.password) {
                    session.user = args.user;

                    socket.emit('login_ok', session.user);

                    if (
                        args.user === config.adminUser
                        && args.password === config.adminPassword
                    ) {
                        session.sudo = true;

                        session.log('admin auth');

                        socket.emit('admin_auth_ok');
                    }
                } else {
                    session.log('wrong password');

                    socket.emit('login_fail');
                }
            });
        });

        socket.on('password', function (args) {
            // args: password, newPassword

            if (
                session.user === undefined
                || !util.verifierStr(/^.+$/)(args.password)
                || !util.verifierStr(/^.+$/)(args.newPassword)
            ) {
                session.log('bad socket request');

                return;
            }

            session.log('change password');

            access.userAuth(session.user, function (password, setter) {
                if (password === args.password) {
                    setter(args.newPassword, function () {
                        socket.emit('password_ok');
                    });

                    return true; // need setter
                } else {
                    session.log('wrong password');

                    socket.emit('password_fail');
                }
            });
        });

        socket.on('list', function (args) {
            // args: (nothing)

            if (
                session.user === undefined
            ) {
                session.log('bad socket request');

                return;
            }

            session.log('list games');

            access.user(
                session.user,
                function (subscribes) {
                    socket.emit('subscribe_data', subscribes);
                },
                function () {
                    session.log('list not found');

                    socket.emit('subscribe_fail_list');
                }
            );
        });

        socket.on('subscribe', function (args) {
            // args: game, enabled

            if (
                session.user === undefined
                || !util.verifierStr(/^[A-Za-z0-9_ ]+$/)(args.game)
                || !util.verifyBool(args.enabled)
            ) {
                session.log('bad socket request');

                return;
            }

            if (args.enabled) {
                session.log('subscribe game ' + args.game);
            } else {
                session.log('unsubscribe game ' + args.game);
            }

            var doSubscribe = function () {
                access.userSubscribe(
                    session.user, args.game, args.enabled,
                    function (subscribes) {
                        socket.emit('subscribe_data', subscribes);
                    },
                    function () {
                        session.log('subscription not allowed');

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
                        session.log('game not found ' + args.game);

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
                session.log('bad socket request');

                return;
            }

            session.log('get report ' + args.game);

            access.game(
                args.game,
                function (uid, players, gameData) {
                    if (uid == args.uid) {
                        return;
                    }

                    var player = undefined;

                    for (var i in players) {
                        if (players[i] === session.user) {
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
                    session.log('game not found ' + args.game);

                    socket.emit('report_fail');
                }
            );
        });

        socket.on('submit', function (args) {
            // args: game, period, price, prod, mk, ci, rd

            if (
                session.user === undefined
                || !util.verifierStr(/^[A-Za-z0-9_ ]+$/)(args.game)
                || !util.verifyInt(args.period)
                || !util.verifyNum(args.price)
                || !util.verifyInt(args.prod)
                || !util.verifyNum(args.mk)
                || !util.verifyNum(args.ci)
                || !util.verifyNum(args.rd)
            ) {
                session.log('bad socket request');

                return;
            }

            session.log('submit ' + args.game);

            access.gameAction(
                args.game,
                function (players, oldData, setter, next) {
                    var player = undefined;

                    for (var i in players) {
                        if (players[i] === session.user) {
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
                                        session.log('submission accepted and peroid closed');
                                    } else {
                                        session.log('submission accepted');
                                    }

                                    setter(undefined, gameData, function () {
                                        // TODO: push updates?
                                    });

                                    socket.emit('submit_ok');
                                } else {
                                    session.log('submission declined ' + args.game);

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
                        session.log('submission not allowed ' + args.game);

                        socket.emit('submit_fail_player');
                    }
                },
                function (setter) {
                    session.log('game not found ' + args.game);

                    socket.emit('submit_fail_game');
                }
            );
        });

        socket.on('admin_message', function (args) {
            // args: message

            if (
                !session.sudo
                || !util.verifierText()(args.message)
            ) {
                session.log('bad socket request');

                return;
            }

            session.log('admin message ' + args.message);

            socket.server.emit('message', args.message);
        });

        socket.on('admin_login', function (args) {
            // args: user

            if (
                !session.sudo
                || !util.verifierStr(/^[A-Za-z0-9_ ]+$/)(args.user)
            ) {
                session.log('bad socket request');

                return;
            }

            session.log('admin login ' + args.user);

            session.user = args.user;

            socket.emit('login_ok', session.user);
        });

        socket.on('admin_password', function (args) {
            // args: newPassword

            if (
                !session.sudo
                || !util.verifierStr(/^.+$/)(args.newPassword)
            ) {
                session.log('bad socket request');

                return;
            }

            session.log('admin change password');

            access.userAuth(session.user, function (password, setter) {
                setter(args.newPassword, function () {
                    socket.emit('password_ok');
                });

                return true; // need setter
            });
        });

        socket.on('admin_list', function (args) {
            // args: (nothing)

            if (
                !session.sudo
            ) {
                session.log('bad socket request');

                return;
            }

            session.log('admin list all');

            access.users(function (userList) {
                access.games(function (gameList) {
                    socket.emit('admin_list_data', {users: userList, games: gameList});
                });
            });
        });

        socket.on('admin_report', function (args) {
            // args: game

            if (
                !session.sudo
                || !util.verifierStr(/^[A-Za-z0-9_ ]+$/)(args.game)
            ) {
                session.log('bad socket request');

                return;
            }

            session.log('admin get report ' + args.game);

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
                    session.log('game not found ' + args.game);

                    socket.emit('admin_report_fail');
                }
            );
        });

        socket.on('admin_transfer', function (args) {
            // args: game, user

            if (
                !session.sudo
                || !util.verifierStr(/^[A-Za-z0-9_ ]+$/)(args.game)
                || !util.verifierStr(/^[A-Za-z0-9_ ]+$/)(args.user)
            ) {
                session.log('bad socket request');

                return;
            }

            session.log('admin transfer game ' + args.game + ' ' + args.user);

            access.gameAction(
                args.game,
                function (players, oldData, setter) {
                    var player = undefined;

                    for (var i in players) {
                        if (players[i] === session.user) {
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
                        session.log('transferring not allowed ' + args.game);

                        socket.emit('admin_transfer_fail_player');
                    }
                },
                function (setter) {
                    session.log('game not found ' + args.game);

                    socket.emit('admin_transfer_fail_game');
                }
            );
        });

        socket.on('admin_init', function (args) {
            // args: game, players, preset, settings

            if (
                !session.sudo
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
                session.log('bad socket request');

                return;
            }

            session.log('admin init game ' + args.game + ' ' + args.preset);
            session.log('allocated ' + args.settings.length + 'pd');

            if (args.players.length == 0 || args.players.length > config.coreMaxPlayer) {
                session.log('player count not supported');

                socket.emit('admin_init_fail_number');
            }

            access.gameAction(
                args.game,
                function (players, oldData, setter) {
                    session.log('game exists ' + args.game);

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
                                            session.log('invited ' + args.players[i]);
                                        },
                                        function () {
                                            session.log('invition not allowed ' + args.players[i]);

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
                !session.sudo
                || !util.verifierStr(/^[A-Za-z0-9_ ]+$/)(args.game)
                || !util.verifierArr(
                        util.verifierObj(
                            util.verifierStr(/^[A-Za-z0-9_]+$/),
                            util.verifyNum
                        )
                    )(args.settings)
            ) {
                session.log('bad socket request');

                return;
            }

            session.log('admin alloc period ' + args.game);
            session.log('allocated ' + args.settings.length + 'pd');

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
                    session.log('game not found ' + args.game);

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
