'use strict';

define('rtmese.game', function (require, module) {
    var bind = require('ui.bind');
    var message = require('ui.message');
    var socket = require('socket');
    var loader = require('loader');

    // report

    // DOM change
    $('#report [bind]').append('<span></span>');
    $('.report_pd>:first-child').append('<span class="pd">/p</span>');

    var currentGame = undefined;
    var currentUid = undefined;
    var currentSettings = undefined;

    var verboseEnabled = false;

    var initReport = function (game, uid) {
        if (game !== currentGame) {
            message('Game: ' + game);
        }

        currentGame = game;
        currentUid = uid;

        bind.variable('game', currentGame);
    };

    var initPlayerList = function (count) {
        // remove items

        $('#report_list [bind]').remove();

        // add items

        for (var i = 0; i < count; ++i) {
            $('#report_players').append(
                '<th bind="players.' + i + '">'
                + '<span></span>'
                + '</th>'
            );
            $('#report_list [list]').each(function (index, element) {
                $(element).append(
                    '<td bind="' + $(element).attr('list') + '.' + i + '">'
                    + '<span></span>'
                    + '</td>'
                );
            });
        }
    };

    var showProgress = function (period, progress) {
        bind.variable('period', period.toFixed(2));
        bind.variable('progress', Math.round(100 * progress) + '%');

        $('#report_period').css('right',
            100 - 100 * (period - Math.floor(period))
        + '%');
        $('#report_progress').css('right',
            100 - 100 * progress
        + '%');
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

    loader.init(function (game) {
        socket.emit('rtmese_join', {
            game: game,
            uid: -1, // force reload
        });
    }, function () {
        if (currentGame !== undefined) {
            loader.load(currentGame);
        }
    });

    $('#report_refresh').click(loader.reload);

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

    // auto refresh
    socket.poll(function () {
        if (currentGame !== undefined) {
            socket.emit('rtmese_join', {
                game: currentGame,
                uid: currentUid,
            });
        }
    }, 30000);

    socket.on('rtmese_report_player', function (data) {
        initReport(data.game, data.uid);
        initPlayerList(data.player_count); // prepare DOM

        showProgress(data.now_period, data.progress);

        showReport(data.players, '', 'players');

        showReport(data.settings, '');
        showReport(data.data, '');
        showReport(data.data_public, '');

        if (data.playing) {
            currentSettings = data.settings;

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
        initReport(data.game, data.uid);
        initPlayerList(data.player_count); // prepare DOM

        showProgress(data.now_period, data.progress);

        showReport(data.players, '', 'players');

        showReport(data.settings, '');
        showReport(data.data_public, '');

        $('#submit').addClass('hide');
        $('#report').removeClass('hide');
    });

    socket.on('rtmese_report_delay', function (data) {
        if (data === 0) {
            // nothing
        } else if (data === 1) {
            message('Go!');
        } else if (data === 4) {
            message('Ready...');
        } else if (data % 30 === 0) {
            message('Game will start in ' + data + ' ticks');
        }
    });

    socket.on('rtmese_join_fail_game', function (data) {
        message('Game not found');
    });

    socket.on('rtmese_join_fail_type', function (data) {
        message('Wrong game type');

        loader.jump(data);
    });

    // submit

    $('#submit_buttons_price>input').each(function (index, element) {
        $(element).click(function (event) {
            var value = parseFloat($('#submit_price').val());
            $('#submit_price').val([
                Math.max(value - 5, currentSettings.limits.price_min),
                Math.max(value - 1, currentSettings.limits.price_min),
                Math.min(value + 1, currentSettings.limits.price_max),
                Math.min(value + 5, currentSettings.limits.price_max),
            ][index]);
        });
    });

    $('#submit_buttons_prod_rate>input').each(function (index, element) {
        $(element).click(function (event) {
            var value = parseFloat($('#submit_prod_rate').val());
            $('#submit_prod_rate').val([
                0,
                Math.max(value - 0.05, 0),
                currentSettings.production.prod_rate_balanced,
                Math.min(value + 0.05, 1),
                1,
            ][index]);
        });
    });

    $('#submit_buttons_mk>input').each(function (index, element) {
        $(element).click(function (event) {
            var value = parseFloat($('#submit_mk').val());
            $('#submit_mk').val([
                0,
                Math.max(value - 2500, 0),
                Math.min(value + 2500, currentSettings.limits.mk_limit),
                currentSettings.limits.mk_limit,
            ][index]);
        });
    });

    $('#submit_buttons_ci>input').each(function (index, element) {
        $(element).click(function (event) {
            var value = parseFloat($('#submit_ci').val());
            $('#submit_ci').val([
                0,
                Math.max(value - 2500, 0),
                Math.min(value + 2500, currentSettings.limits.ci_limit),
                currentSettings.limits.ci_limit,
            ][index]);
        });
    });

    $('#submit_buttons_rd>input').each(function (index, element) {
        $(element).click(function (event) {
            var value = parseFloat($('#submit_rd').val());
            $('#submit_rd').val([
                0,
                Math.max(value - 2500, 0),
                Math.min(value + 2500, currentSettings.limits.rd_limit),
                currentSettings.limits.rd_limit,
            ][index]);
        });
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

    // socket.on('rtmese_submit_ok', function (data) {
    //     message('Submission ok');
    // });

    socket.on('rtmese_submit_fail_player', function (data) {
        message('Submission not allowed');
    });

    socket.on('rtmese_submit_fail_running', function (data) {
        message('Game is not running');
    });
});
