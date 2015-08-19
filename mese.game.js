'use strict';

var core = require('./mese.core');
var db = require('./mese.db');

module.exports.submit = function (
    storage, player,
    price, prod, mk, ci, rd,
    callback, fail
) {
    var decisions = storage.dynamicGet('decisions');

    if (typeof decisions != 'array') {
        decisions = [];
    }

    decisions.push({
        player: player,
        price: price,
        prod: prod,
        mk: mk,
        ci: ci,
        rd: rd,
        callback: callback,
        fail: fail,
    });

    storage.dynamicSet('decisions', decisions);
};

// TODO: handle 'decisions' buffer, close period, execute callbacks
