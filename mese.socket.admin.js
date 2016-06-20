'use strict';

var config = require('./config');
var verify = require('./util.verify');
var access = require('./server.access');
var admin = require('./mese.admin');

module.exports = function (socket, session) {
    socket.on('admin_report', function (args) {
        // args: game

        if (
            !session.sudo
            || !verify.str(/^[A-Za-z0-9_ ]+$/)(args.game)
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
                        report.game = args.game;
                        report.uid = uid;
                        report.players = players;

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
            || !verify.str(/^[A-Za-z0-9_ ]+$/)(args.game)
            || !verify.str(/^[A-Za-z0-9_ ]+$/)(args.user)
        ) {
            session.log('bad socket request');

            return;
        }

        session.log('admin transfer game ' + args.game + ' ' + args.user);

        access.gameAction(
            args.game,
            function (players, oldData, setter) {
                var player = -1;

                for (var i in players) {
                    if (players[i] === session.user) {
                        player = parseInt(i, 10);
                        break;
                    }
                }

                if (player >= 0) {
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
            || !verify.str(/^[A-Za-z0-9_ ]+$/)(args.game)
            || !verify.arr(verify.str(/^[A-Za-z0-9_ ]+$/))(args.players)
            || !verify.str(/^[A-Za-z0-9_]+$/)(args.preset)
            || !verify.arr(
                    verify.obj(
                        verify.str(/^[A-Za-z0-9_]+$/),
                        verify.num()
                    )
                )(args.settings)
        ) {
            session.log('bad socket request');

            return;
        }

        session.log('admin init game ' + args.game + ' ' + args.preset);
        session.log('allocated ' + args.settings.length + 'pd');

        if (args.players.length == 0 || args.players.length > config.meseMaxPlayer) {
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
                            var subscribe = function (player) {
                                access.userSubscribe(
                                    player, args.game, true,
                                    function (subscribes) {
                                        session.log('invited ' + player);
                                    },
                                    function () {
                                        session.log('invition not allowed ' + player);

                                        socket.emit('admin_init_fail_invite', player);
                                    }
                                );
                            };

                            for (var i in args.players) {
                                subscribe(args.players[i]);
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
            || !verify.str(/^[A-Za-z0-9_ ]+$/)(args.game)
            || !verify.arr(
                    verify.obj(
                        verify.str(/^[A-Za-z0-9_]+$/),
                        verify.num()
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
};
