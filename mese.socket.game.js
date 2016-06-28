'use strict';

var verify = require('./util.verify');
var access = require('./server.access');
var game = require('./mese.game');

module.exports = function (socket, session) {
    socket.on('mese_report', function (args) {
        // args: game, uid

        if (
            !verify.str(/^[A-Za-z0-9_ ]+$/)(args.game)
            || !verify.int()(args.uid)
        ) {
            session.log('bad socket request');

            return;
        }

        session.log('get report ' + args.game);

        access.game(
            'mese', args.game,
            function (uid, players, gameData) {
                if (uid === args.uid) {
                    return;
                }

                var player = -1;

                for (var i in players) {
                    if (players[i] === session.user) {
                        player = parseInt(i, 10);
                        break;
                    }
                }

                game.print(
                    gameData, player,
                    function (report) {
                        report.game = args.game;
                        report.uid = uid;
                        report.players = players;

                        socket.emit('mese_report_player', report);
                    },
                    function (report) {
                        report.game = args.game;
                        report.uid = uid;
                        report.players = players;

                        socket.emit('mese_report_public', report);
                    }
                );
            },
            function () {
                session.log('game not found ' + args.game);

                socket.emit('mese_report_fail_game');
            },
            function () {
                session.log('wrong game type ' + args.game);

                socket.emit('mese_report_fail_type');
            }
        );
    });

    socket.on('mese_submit', function (args) {
        // args: game, period, price, prod, mk, ci, rd

        if (
            session.user === undefined
            || !verify.str(/^[A-Za-z0-9_ ]+$/)(args.game)
            || !verify.int()(args.period)
            || !verify.num()(args.price)
            || !verify.int()(args.prod)
            || !verify.num()(args.mk)
            || !verify.num()(args.ci)
            || !verify.num()(args.rd)
        ) {
            session.log('bad socket request');

            return;
        }

        session.log('submit ' + args.game);

        access.gameAction(
            'mese', args.game,
            function (players, oldData, setter, next) {
                var player = -1;

                for (var i in players) {
                    if (players[i] === session.user) {
                        player = parseInt(i, 10);
                        break;
                    }
                }

                if (player >= 0) {
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

                                socket.emit('mese_submit_ok');
                            } else {
                                session.log('submission declined ' + args.game);

                                next(); // manually finish

                                socket.emit('mese_submit_decline');
                            }
                        },
                        function (report) {
                            socket.emit('mese_report_early', report);
                        }
                    );

                    return true; // need setter() or next()
                } else {
                    session.log('submission not allowed ' + args.game);

                    socket.emit('mese_submit_fail_player');
                }
            },
            function (setter) {
                session.log('game not found ' + args.game);

                socket.emit('mese_submit_fail_game');
            },
            function () {
                session.log('wrong game type ' + args.game);

                socket.emit('mese_submit_fail_type');
            }
        );
    });
};
