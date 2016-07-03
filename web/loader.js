'use strict';

define('loader', function (require, module) {
    var message = require('ui.message');

    var loadGame = undefined;
    var reloadGame = undefined;

    // load from url hash
    var loadHash = function () {
        var urlHash = window.location.hash.slice(1);
        if (urlHash !== '') {
            loadGame(urlHash);
        }
    };
    $(loadHash);
    $(window).on('hashchange', loadHash);

    module.exports.init = function (load, reload) {
        loadGame = load;
        reloadGame = reload;
    };

    module.exports.reload = function () {
        reloadGame();
    };

    module.exports.load = function (game) {
        window.location.hash = game;
    };

    module.exports.jump = function (type) {
        message('Redirecting...');

        setTimeout(function () {
            window.location.pathname = type;
        }, 1000);
    };
});
