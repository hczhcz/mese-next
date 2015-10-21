'use strict';

var domain = require('domain');

var core = require('./mese.core');

var addDecision = function (storage, decision) {
    var decisions = storage.dynamicGet('decisions');

    if (typeof decisions != 'array') {
        decisions = [];
        storage.dynamicSet('decisions', decisions);
    }

    // insert into queue
    decisions.push(decision);
};

var handleDecisions = function (storage, gameData, callback, fail) {
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
                handleDecisions(storage, gameData, callback, fail);
            },
            function (gameData) {
                // declined
                decision.fail(gameData);
                handleDecisions(storage, gameData, callback, fail);
            }
        );
    } else {
        // close

        core.close(gameData, callback, fail); // exit recursion
    }
};

var storeData = function (storage, gameData, oldData, snapshot, callback) {
    if (!gameData || gameData.length != oldData.length) {
        throw Error('data broken');
    }

    // generate an unique id (assumed unique)
    var uid = Number(new Date());

    // store data
    storage.staticSet(
        'data', gameData,
        function (doc) {
            storage.staticSet(
                'uid', uid,
                callback
            );
        }
    );

    if (snapshot) {
        // store snapshot
        storage.staticSet(
            'data_' + uid, gameData,
            function (doc) {
                // nothing
            }
        );
    }
};

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

        // get data and do handling
        storage.staticGet('data', function (dataObj) {
            var oldData = dataObj.buffer;

            handleDecisions(
                storage, oldData,
                function (gameData) {
                    storeData(storage, gameData, oldData, true, function () {
                        storage.dynamicSet('active', false);
                    });
                },
                function (gameData) {
                    storeData(storage, gameData, oldData, false, function () {
                        storage.dynamicSet('active', false);
                    });
                }
            );
        });
    });
};

module.exports.submit = function (
    storage, player, period,
    price, prod, mk, ci, rd,
    callback, fail
) {
    addDecision(
        storage,
        {
            player: player,
            period: period,
            price: price,
            prod: prod,
            mk: mk,
            ci: ci,
            rd: rd,
            callback: callback,
            fail: fail,
        }
    );

    action(storage);
};
