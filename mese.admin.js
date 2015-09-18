'use strict';

var util = require('./mese.util');
var core = require('./mese.core');
var db = require('./mese.db');

db.init(function () {
    var initGame = function (name, players) {
        var gameStorage = db.access('games', name);

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
                            'players', players,
                            function (doc) {
                                // nothing
                            }
                        );
                    } else {
                        size += 1;

                        core.alloc(gameData, [], doAlloc);
                    }
                };

                core.init(players.length, 'modern', [], doAlloc);
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
