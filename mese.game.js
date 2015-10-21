'use strict';

var domain = require('domain');

var core = require('./mese.core');
var db = require('./mese.db');

var action = function (storage) {
    if (storage.dynamicGet('active')) {
        return;
    }

    var d = domain.create();

    d.on('error', function (e) {
        storage.dynamicSet('active', false);

        throw e;
    });

    d.add(storage);

    d.run(function () {
        if (storage.dynamicGet('active')) {
            return;
        }

        storage.dynamicSet('active', true);

        var handleDecision = function (gameData) {
            var oldData = gameData;

            var decisions = storage.dynamicGet('decisions');

            if (decisions.length > 0) {
                // submit

                // get decision from queue
                var decision = decisions.shift();

                core.submit(
                    gameData, decision.player, decision.period,
                    decision.price,
                    decision.prod,
                    decision.mk,
                    decision.ci,
                    decision.rd,
                    function (gameData) {
                        // accepted
                        decision.callback(gameData);
                        handleDecision(gameData);
                    },
                    function (gameData) {
                        // declined
                        decision.fail(gameData);
                        handleDecision(gameData);
                    }
                );
            } else {
                // close

                // generate an unique id (assumed unique)
                var uid = Number(new Date());

                core.close(
                    gameData,
                    function (gameData) {
                        // closed

                        if (!gameData || gameData.length != oldData.length) {
                            throw Error('data broken');
                        }

                        // store data
                        storage.staticSet(
                            'data', gameData,
                            function (doc) {
                                storage.staticSet(
                                    'uid', uid,
                                    function (doc) {
                                        storage.dynamicSet('active', false);
                                    }
                                );
                            }
                        );

                        // store snapshot
                        storage.staticSet(
                            'data_' + uid, gameData,
                            function (doc) {}
                        );
                    },
                    function (gameData) {
                        // not closed

                        if (!gameData || gameData.length != oldData.length) {
                            throw Error('data broken');
                        }

                        // store data
                        storage.staticSet(
                            'data', gameData,
                            function (doc) {
                                storage.staticSet(
                                    'uid', uid,
                                    function (doc) {
                                        storage.dynamicSet('active', false);
                                    }
                                );
                            }
                        );
                    }
                );
            }
        };

        // get data and do handling
        storage.staticGet('data', function (dataObj) {
            handleDecision(dataObj.buffer);
        });
    });
};

module.exports.submit = function (
    storage, player, period,
    price, prod, mk, ci, rd,
    callback, fail
) {
    var decisions = storage.dynamicGet('decisions');

    if (typeof decisions != 'array') {
        decisions = [];

        storage.dynamicSet('decisions', decisions);
    }

    // insert into queue
    decisions.push({
        player: player,
        period: period,
        price: price,
        prod: prod,
        mk: mk,
        ci: ci,
        rd: rd,
        callback: callback,
        fail: fail,
    });

    action(storage);
};
