'use strict';

var util = require('./mese.util');
var core = require('./mese.core');
var db = require('./mese.db');

db.init(function () {
    var initGame = function (game, players, settings) {
        util.log('create game ' + game + ' ' + JSON.stringify(players));

        var gameStorage = db.access('games', game);

        gameStorage.staticGetMulti(function (map) {
            if (!map) {
                // create new game

                var period = 0;

                var doAlloc = function (gameData) {
                    period += 1;

                    if (period < settings.length) {
                        core.alloc(gameData, settings[period], doAlloc);
                    } else {
                        // generate an unique id (assumed unique)
                        var uid = Number(new Date());

                        gameStorage.staticSetMulti(
                            {
                                data: gameData,
                                uid: uid,
                                players: players,
                            },
                            function (doc) {
                                // nothing
                            }
                        );
                    }
                };

                var doInvite = function (player) {
                    var authStorage = db.access('users', player);

                    authStorage.staticGet('subscribes', function (subscribes) {
                        if (!subscribes) {
                            subscribes = {};
                        }

                        subscribes[game] = true;

                        authStorage.staticSet(
                            'subscribes', subscribes,
                            function (doc) {
                                util.log('invite ' + player + ' ' + game);
                            }
                        );
                    });
                };

                // alloc periods
                core.init(players.length, 'modern', settings[0], doAlloc);

                // add subscriptions
                for (var i in players) {
                    doInvite(players[i]);
                }
            } else {
                util.log('game exists');
            }
        });
    };

    initGame(
        'test',
        [
            'test0001'
        ],
        [
            {}, {}, {}, {}, {}, {}, {}, {}
        ]
    );
});
