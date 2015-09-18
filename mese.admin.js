'use strict';

var util = require('./mese.util');
var core = require('./mese.core');
var db = require('./mese.db');

db.init(function () {
    var initGame = function (game, invites) {
        util.log('create game ' + game + ' ' + JSON.stringify(invites));

        var gameStorage = db.access('games', game);

        gameStorage.staticGet('players', function (players) {
            if (players === undefined) {
                // create new game

                var size = 0;

                var doAlloc = function (gameData) {
                    if (size >= 7) {
                        gameStorage.staticSet(
                            'data', gameData,
                            function (doc) {
                                // nothing
                            }
                        );
                        gameStorage.staticSet(
                            'players', invites,
                            function (doc) {
                                // nothing
                            }
                        );
                    } else {
                        size += 1;

                        core.alloc(gameData, [], doAlloc);
                    }
                };

                var doInvite = function (player) {
                    var authStorage = db.access('users', player);

                    authStorage.staticGet('subscribes', function (subscribes) {
                        if (subscribes === undefined) {
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
                core.init(invites.length, 'modern', [], doAlloc);

                // add subscriptions
                for (var i in invites) {
                    doInvite(invites[i]);
                }
            } else {
                util.log('game exists');
            }
        });
    };

    initGame(
        'test',
        [
            'test0001', 'test0002', 'test0003', 'test0004',
            'test0005', 'test0006', 'test0007', 'test0008',
        ]
    );
});
