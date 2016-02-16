'use strict';

var util = require('./mese.util');

var tasks = {
    users: {},
    games: {},
};

module.exports.put = function (lv1, lv2, value) {
    if (!tasks[lv1][lv2]) {
        tasks[lv1][lv2] = {
            active: false,
            functions: [],
        };
    }

    var task = tasks[lv1][lv2];

    task.functions.push(value);

    if (task.active) {
        return;
    }

    task.active = true;

    var next = function () {
        if (task.functions.length > 0) {
            task.functions.shift()(next);
        } else {
            task.active = false;
        }
    };

    util.domainRun([], next, function () {
        task.active = false;
    });
};
