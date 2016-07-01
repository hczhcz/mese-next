'use strict';

define('rtmese.game', function (require, module) {
    var bind = require('ui.bind');
    var message = require('ui.message');
    var socket = require('socket');
    var user = require('site.user');
    var admin = require('site.admin');

    // report

    // DOM change
    $('#report [bind]').append('<span></span>');

    var currentGame = undefined;

    var verboseEnabled = false;

    var initReport = function (game, playing, delay) {
        if (game !== currentGame) {
            message('Game: ' + game);
        }

        currentGame = game;

        bind.variable('game', currentGame);

        if (playing) {
            if (delay === 0) {
                // nothing
            } else if (delay === 1) {
                message('Go!');
            } else if (delay === 4) {
                message('Ready...');
            } else if (delay % 30 === 0) {
                message('Game will start in ' + delay + ' ticks');
            }

            $('#submit input').attr('disabled', false);
        } else {
            $('#submit input').attr('disabled', true);
        }
    };

    var initPlayerList = function (count) {
        // remove items

        $('#report_list [bind]').remove();

        // add items

        for (var i = 0; i < count; ++i) {
            $('#report_players')
                .append(
                    '<th bind="players.' + i + '">'
                    + '<span></span>'
                    + '</th>'
                );
            $('#report_list [list]').each(function () {
                $(this).append(
                    '<td bind="' + $(this).attr('list') + '.' + i + '">'
                    + '<span></span>'
                    + '</td>'
                );
            });
        }
    };

    var showProgress = function (period, progress) {
        bind.variable('period', period.toFixed(2));
        bind.variable('progress', Math.round(100 * progress) + '%');

        $('#report_period').css('right', (100 - 100 * (
            period - Math.floor(period)
        )) + '%');
        $('#report_progress').css('right', (100 - 100 * (
            progress
        )) + '%');
    };

    var showReport = function (data, tail, path) {
        if (typeof data === 'string' || typeof data === 'number') {
            var target = $('[bind="' + path + '"]' + tail);

            if (target.length === 1) {
                target.find('span').text(data);
                target.removeClass('hide');
            } else {
                // never reach
                throw Error('data binding error ' + path);
            }
        } else if (typeof data === 'object') {
            for (var i in data) {
                showReport(
                    data[i], tail,
                    path !== undefined ? path + '.' + i : i
                );
            }
        }
    };

    var joinGame = function (game) {
        socket.emit('rtmese_join', {
            game: game,
        });
    };

    // load from url hash
    var loadHash = function () {
        var urlHash = window.location.hash.slice(1);
        if (urlHash !== '') {
            joinGame(urlHash);
        }
    };
    loadHash();
    $(window).on('hashchange', loadHash);

    $('#report_expand').click(function () {
        if (verboseEnabled) {
            verboseEnabled = false;

            $('.report_verbose').addClass('hide');
            $('#report_expand').text('+');
        } else {
            verboseEnabled = true;

            $('.report_verbose').removeClass('hide');
            $('#report_expand').text('-');
        }
    });

    socket.on('rtmese_report_player', function (data) {
        initReport(data.game, data.playing, data.delay);
        initPlayerList(data.player_count); // prepare DOM

        showProgress(data.now_period, data.progress);

        showReport(data.players, '', 'players');

        showReport(data.settings, '');
        showReport(data.data, '');
        showReport(data.data_public, '');

        if (data.progress < 1 && data.playing) {
            $('#submit_price')
                .attr('min', data.settings.limits.price_min)
                .attr('max', data.settings.limits.price_max);
            $('#submit_prod_rate')
                .attr('min', 0)
                .attr('max', 1);
            $('#submit_mk')
                .attr('min', 0)
                .attr('max', data.settings.limits.mk_limit);
            $('#submit_ci')
                .attr('min', 0)
                .attr('max', data.settings.limits.ci_limit);
            $('#submit_rd')
                .attr('min', 0)
                .attr('max', data.settings.limits.rd_limit);

            $('#submit input').attr('disabled', false);
        } else {
            $('#submit input').attr('disabled', true);
        }

        $('#submit').removeClass('hide');
        $('#report').removeClass('hide');
    });

    socket.on('rtmese_report_public', function (data) {
        initReport(data.game, data.playing, data.delay);
        initPlayerList(data.player_count); // prepare DOM

        showProgress(data.now_period, data.progress);

        showReport(data.players, '', 'players');

        showReport(data.settings, '');
        showReport(data.data_public, '');

        $('#submit').addClass('hide');
        $('#report').removeClass('hide');
    });

    socket.on('rtmese_join_fail_game', function (data) {
        message('Game not found');
    });

    socket.on('rtmese_join_fail_type', function (data) {
        message('Wrong game type');
    });

    // submit

    $('#submit_price').change(function () {
        $('#submit_price').val(
            0.01 * Math.round(100 * $('#submit_price').val())
        );
    });

    // $('#submit_prod_rate').change(function () {
    //     $('#submit_prod_rate').val(
    //         0.01 * Math.round(100 * $('#submit_prod_rate').val())
    //     );
    // });

    $('#submit_mk').change(function () {
        $('#submit_mk').val(
            0.01 * Math.round(100 * $('#submit_mk').val())
        );
    });

    $('#submit_ci').change(function () {
        $('#submit_ci').val(
            0.01 * Math.round(100 * $('#submit_ci').val())
        );
    });

    $('#submit_rd').change(function () {
        $('#submit_rd').val(
            0.01 * Math.round(100 * $('#submit_rd').val())
        );
    });

    $('#submit_submit').click(function (event) {
        event.preventDefault();

        socket.emit('rtmese_submit', {
            game: currentGame,
            price: parseFloat($('#submit_price').val()),
            prod_rate: parseFloat($('#submit_prod_rate').val()),
            mk: parseFloat($('#submit_mk').val()),
            ci: parseFloat($('#submit_ci').val()),
            rd: parseFloat($('#submit_rd').val()),
        });
    });

    socket.on('rtmese_submit_ok', function (data) {
        message('Submission ok');
    });

    socket.on('rtmese_submit_fail_player', function (data) {
        message('Submission not allowed');
    });

    socket.on('rtmese_submit_fail_running', function (data) {
        message('Game is not running');
    });

    user.gameLoaders.defaultGame = joinGame;
    user.gameLoaders.loadGame = joinGame;
    admin.gameLoaders.defaultGame = joinGame;
    admin.gameLoaders.loadGame = joinGame;
});
