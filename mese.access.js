'use strict';

var db = require('./mese.db');

module.exports.user = function (name, callback) {
    db.get('users', name, callback);
};

module.exports.game = function (game, callback) {
    db.get('games', game, callback);
};

module.exports.userAuth = function (name, callback) {
    db.update('users', name, function (doc, setter, next) {
        var resultPassword = undefined;
        var resultCallback = undefined;

        callback(
            doc ? doc.password : undefined,
            function (password, callback) {
                resultPassword = password;
                resultCallback = callback;
            }
        );

        if (resultPassword) {
            setter(
                {password: resultPassword},
                function () {
                    resultCallback();
                    next();
                }
            );
        } else {
            next();
        }
    });
};

module.exports.userSubscribe = function (name, game, enabled, callback) {
    db.update('users', name, function (doc, setter, next) {
        var subscribes = doc.subscribes || {};
        subscribes[game] = enabled;

        setter(
            {subscribes: subscribes},
            function () {
                callback(subscribes);
                next();
            }
        );
    });
};

module.exports.gamePlayers = function (game, callback, fail) { // TODO: duplication code
    db.update('games', game, function (doc, setter, next) {
        var resultPlayers = undefined;
        var resultCallback = undefined;

        if (doc) {
            callback(doc.players, function (players, callback) {
                resultPlayers = players;
                resultCallback = callback;
            });
        } else {
            fail(function (players, callback) {
                resultPlayers = players;
                resultCallback = callback;
            });
        }

        if (resultPlayers) {
            setter(
                {
                    // generate an unique id (assumed unique)
                    uid: Number(new Date()),
                    players: resultPlayers,
                },
                function () {
                    resultCallback();
                    next();
                }
            );
        } else {
            next();
        }
    });
};

module.exports.gameData = function (game, callback, fail) { // TODO: duplication code
    db.update('games', game, function (doc, setter, next) {
        var resultData = undefined;
        var resultCallback = undefined;

        if (doc) {
            // notice: .buffer is required for binary data
            callback(doc.players, doc.data.buffer, function (gameData, callback) {
                resultData = gameData;
                resultCallback = callback;
            });
        } else {
            fail(function (gameData, callback) {
                resultData = gameData;
                resultCallback = callback;
            });
        }

        if (resultData) {
            setter(
                {
                    // generate an unique id (assumed unique)
                    uid: Number(new Date()),
                    data: resultData,
                },
                function () {
                    resultCallback();
                    next();
                }
            );
        } else {
            next();
        }
    });
};
