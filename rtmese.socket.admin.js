'use strict';

var config = require('./config');
var verify = require('./util.verify');
var access = require('./server.access');
var admin = require('./rtmese.admin');
var manager = require('./rtmese.manager');

module.exports = function (socket, session) {
    socket.on('admin_rtmese_report', function (args) {
        // args: game, uid

        if (
            !session.sudo
            || !verify.str(/^[A-Za-z0-9_ ]+$/)(args.game)
        ) {
            session.log('bad socket request');

            return;
        }

        session.log('admin get report ' + args.game);

        access.game(
            'rtmese', args.game,
            function (uid, players, gameData) {
                var print = function (report) {
                    report.game = args.game;
                    report.uid = uid;
                    report.players = players;

                    socket.emit('admin_rtmese_report_data', report);
                };

                manager.get(
                    args.game,
                    print,
                    function () {
                        print(JSON.parse(gameData));
                    }
                );
            },
            function () {
                session.log('game not found ' + args.game);

                socket.emit('admin_rtmese_report_fail_game');
            },
            function () {
                session.log('wrong game type ' + args.game);

                socket.emit('admin_rtmese_report_fail_type');
            }
        );
    });

    socket.on('admin_rtmese_init', function (args) {
        // args: game, players, ticks, events

        if (
            !session.sudo
            || !verify.str(/^[A-Za-z0-9_ ]+$/)(args.game)
            || !verify.arr(verify.str(/^[A-Za-z0-9_ ]+$/))(args.players)
            || !verify.int(args.ticks)
            || !verify.arr(
                    verify.obj(
                        verify.str(/^[0-9]+$/), // int
                        verify.obj(
                            verify.str(/^[a-z_]+$/),
                            verify.num()
                        )
                    )
                )(args.events)
        ) {
            session.log('bad socket request');

            return;
        }

        session.log('admin init game ' + args.game);

        if (args.players.length === 0 || args.players.length > config.rtmeseMaxPlayer) {
            session.log('player count not supported');

            socket.emit('admin_rtmese_init_fail_player');
        }

        access.gameAction(
            'rtmese', args.game,
            function (players, oldData, setter, next) {
                session.log('game exists ' + args.game);

                socket.emit('admin_rtmese_init_fail_game');
            },
            function (setter) {
                var gameObj = admin.init(
                    args.players.length, args.ticks, args.events
                );

                setter(args.players, Buffer(JSON.stringify(gameObj)), function () {
                    var invite = function (player) {
                        access.userSubscribe(
                            player, args.game, true,
                            function (subscribes) {
                                session.log('invited ' + player);
                            },
                            function () {
                                session.log('invition not allowed ' + player);

                                socket.emit('admin_rtmese_init_fail_invite', player);
                            }
                        );
                    };

                    for (var i in args.players) {
                        invite(args.players[i]);
                    }

                    socket.emit('admin_rtmese_init_ok');
                });

                return true; // need setter
            },
            function () {
                session.log('wrong game type ' + args.game);

                socket.emit('admin_rtmese_init_fail_type');
            }
        );
    });

    socket.on('admin_rtmese_schedule', function (args) {
        // args: game, delay

        if (
            !session.sudo
            || !verify.str(/^[A-Za-z0-9_ ]+$/)(args.game)
            || !verify.int()(args.delay)
        ) {
            session.log('bad socket request');

            return;
        }

        session.log('admin schedule game ' + args.game);

        var gameExec = function (gameObj, playing) {
            for (var i = 0; i < gameObj.player_count; ++i) {
                if (gameObj['notify_' + i] !== undefined) {
                    gameObj['notify_' + i](playing);
                }
            }
        };

        var gameStop = function (gameObj) {
            access.gameAction(
                'rtmese', args.game,
                function (players, oldData, setter, next) {
                    setter(undefined, Buffer(JSON.stringify(gameObj)), function () {
                        // nothing
                    });

                    return true;
                },
                function (setter) {
                    throw Error('internal error'); // never reach
                },
                function () {
                    throw Error('internal error'); // never reach
                }
            );
        };

        access.gameAction(
            'rtmese', args.game,
            function (players, oldData, setter, next) {
                manager.schedule(
                    args.game, JSON.parse(oldData), args.delay,
                    admin.exec,
                    function (gameObj) {
                        gameExec(gameObj, true);
                    },
                    function (gameObj) {
                        gameExec(gameObj, true);
                    },
                    function (gameObj) {
                        gameExec(gameObj, false);
                        gameStop(gameObj);
                    },
                    function () {
                        socket.emit('admin_rtmese_schedule_ok');
                    },
                    function () {
                        session.log('game is already running ' + args.game);

                        socket.emit('admin_rtmese_schedule_fail_running');
                    }
                );
            },
            function (setter) {
                session.log('game not found ' + args.game);

                socket.emit('admin_rtmese_schedule_fail_game');
            },
            function () {
                session.log('wrong game type ' + args.game);

                socket.emit('admin_rtmese_schedule_fail_type');
            }
        );
    });

    socket.on('admin_rtmese_stop', function (args) {
        // args: game

        if (
            !session.sudo
            || !verify.str(/^[A-Za-z0-9_ ]+$/)(args.game)
        ) {
            session.log('bad socket request');

            return;
        }

        session.log('admin stop game ' + args.game);

        manager.stop(
            args.game,
            function () {
                socket.emit('admin_rtmese_stop_ok');
            },
            function () {
                session.log('game is not running ' + args.game);

                socket.emit('admin_rtmese_stop_fail');
            }
        );
    });

    // socket.on('admin_rtmese_revent', function (args) { // not implemented
    // });
};
