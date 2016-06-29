'use strict';

var verify = require('./util.verify');
var access = require('./server.access');
var game = require('./rtmese.game');
var manager = require('./rtmese.manager');

module.exports = function (socket, session) {
    socket.on('rtmese_join', function (args) {
        // args: game

        if (
            !verify.str(/^[A-Za-z0-9_ ]+$/)(args.game)
        ) {
            session.log('bad socket request');

            return;
        }

        session.log('join game ' + args.game);

        access.game(
            'rtmese', args.game,
            function (uid, players, gameData) {
                var print = function (gameObj, player) {
                    game.print(
                        gameObj, player,
                        function (report) {
                            report.game = args.game;
                            report.uid = uid;
                            report.players = players;

                            socket.emit('rtmese_report_player', report);
                        },
                        function (report) {
                            report.game = args.game;
                            report.uid = uid;
                            report.players = players;

                            socket.emit('rtmese_report_public', report);
                        }
                    );
                };

                var player = -1;

                for (var i in players) {
                    if (players[i] === session.user) {
                        player = parseInt(i, 10);
                        break;
                    }
                }

                if (player >= 0) {
                    manager.get(
                        args.game,
                        function (gameObj) {
                            gameObj['check_' + player] = function (name) {
                                return name === players[player];
                            };

                            gameObj['notify_' + player] = function () {
                                print(gameObj, player);
                            };

                            if (session.rtmese_free !== undefined) {
                                session.rtmese_free();
                            }
                            session.rtmese_free = function () {
                                delete gameObj['check_' + player];
                                delete gameObj['notify_' + player];
                            };

                            print(gameObj, player);

                            socket.emit('rtmese_join_active');
                        },
                        function () {
                            print(JSON.parse(gameData), player);

                            socket.emit('rtmese_join_finish');
                        }
                    );
                } else {
                    print(JSON.parse(gameData), player);

                    socket.emit('rtmese_join_finish');
                }
            },
            function () {
                session.log('game not found ' + args.game);

                socket.emit('rtmese_join_fail_game');
            },
            function () {
                session.log('wrong game type ' + args.game);

                socket.emit('rtmese_join_fail_type');
            }
        );
    });

    socket.on('rtmese_submit', function (args) {
        // args: game, price, prod, mk, ci, rd

        if (
            session.user === undefined
            || !verify.str(/^[A-Za-z0-9_ ]+$/)(args.game)
            || !verify.num()(args.price)
            || !verify.num()(args.prod_rate)
            || !verify.num()(args.mk)
            || !verify.num()(args.ci)
            || !verify.num()(args.rd)
        ) {
            session.log('bad socket request');

            return;
        }

        session.log('submit ' + args.game);

        manager.get(
            args.game,
            function (gameObj) {
                var player = -1;

                for (var i = 0; i < gameObj.player_count; ++i) {
                    if (gameObj['check_' + i] !== undefined) {
                        if (gameObj['check_' + i](session.user)) {
                            player = i;
                            break;
                        }
                    }
                }

                if (player >= 0) {
                    game.submit(
                        gameObj, player,
                        args.price, args.prod_rate, args.mk, args.ci, args.rd
                    );

                    socket.emit('rtmese_submit_ok');
                } else {
                    session.log('submission not allowed ' + args.game);

                    socket.emit('rtmese_submit_fail_player');
                }
            },
            function () {
                session.log('game is not running ' + args.game);

                socket.emit('rtmese_submit_fail_game');
            }
        );
    });

    socket.on('disconnect', function () { // notice: an extra hook
        if (session.rtmese_free !== undefined) {
            session.rtmese_free();
        }
    });
};
