'use strict';

var config = require('./mese.config');
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

        if (resultPassword !== undefined) {
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

module.exports.gameAction = function (game, callback, fail) {
    db.update('games', game, function (doc, setter, next) {
        var resultPlayers = undefined;
        var resultData = undefined;
        var resultCallback = undefined;

        if (doc) {
            // notice: .buffer is required for binary data
            callback(doc.players, doc.data.buffer, function (players, gameData, callback) {
                resultPlayers = players;
                resultData = gameData;
                resultCallback = callback;
            });
        } else {
            fail(function (players, gameData, callback) {
                resultPlayers = players;
                resultData = gameData;
                resultCallback = callback;
            });
        }

        if (resultPlayers !== undefined || resultData !== undefined) {
            // generate an unique id (assumed unique)
            var diff = {uid: Number(new Date())};

            if (resultPlayers !== undefined) {
                diff.players = resultPlayers;
            }
            if (resultData !== undefined) {
                if (resultData.length < config.coreMinDataSize) {
                    throw Error('broken data');
                }
                diff.data = resultData;
            }

            setter(
                diff,
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
