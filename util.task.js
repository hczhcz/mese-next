'use strict';

var util = require('./util');

var tasks = {};

module.exports = function (lv1, lv2, callback) {
    if (tasks[lv1] === undefined) {
        tasks[lv1] = {};
    }
    if (tasks[lv1][lv2] === undefined) {
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
                    function (err) {
                        util.err(err);

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
