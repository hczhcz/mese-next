'use strict';

define('ui.bind', function (require, module) {
    module.exports.variable = function (key, value) {
        $('td[var=' + key + ']').text(value);
        $('span[var=' + key + ']').text(value);
        $('input[var=' + key + ']').val(value);
    };
});
