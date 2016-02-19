'use strict';

var util = require('./mese.util');

var tasks = {
    users: {},
    games: {},
};

module.exports = function (lv1, lv2, callback) {
    if (!tasks[lv1][lv2]) {
        tasks[lv1][lv2] = {
            active: false,
            functions: [],
        };
    }

    var task = tasks[lv1][lv2];

    task.functions.push(callback);

    if (!task.active) {
        task.active = true;

        var next = function () {
            if (task.functions.length > 0) {
                util.domainRun([],
                    function () {
                        task.functions.shift()(next);
                    },
                    function (e) {
                        util.log(e.stack || e);

                        next();
                    }
                );
            } else {
                task.active = false;
            }
        };
        next();
    }
};
