'use strict';

// report

// DOM change
$('#report [bind]')
    .append('<span class="last"><span></span>&nbsp;</span>')
    .append('<span class="now"><span></span></span>')
    .append('<span class="next">&nbsp;<span></span></span>');

var currentGame = undefined;
var currentPeriod = undefined;
var currentUid = undefined;
var currentSettings = undefined;

var verboseEnabled = false;

var initReport = function (game, period, uid) {
    if (game !== currentGame) {
        message('Game: ' + game);
    }
    if (game === currentGame && period !== currentPeriod) {
        message('Period: ' + period);
    }

    currentGame = game;
    currentPeriod = period;
    currentUid = uid;

    $('#subscribe_game').val(currentGame);

    $('[var=game]').text(currentGame);
    $('[var=period]').text(currentPeriod - 1);
    $('[var=next_period]').text(currentPeriod);

    $('.last').addClass('hide');
    $('.now').addClass('hide');
    $('.next').addClass('hide');
};

var showReport = function (head, data, tail, xbind /* patch */) {
    if (head.length == 0) {
        return;
    }

    if (typeof data == 'string' || typeof data == 'number') {
        var target = head.find('.' + tail);

        if (target.length == 1) {
            target.find('span').text(data);
            target.removeClass('hide');
        }
    } else if (typeof data == 'object') {
        for (var i in data) {
            // top-level bind
            if (xbind && data[i] instanceof Array /* notice: optimization */) {
                showReport($('#report [xbind=' + i + ']'), data[i], tail);
            }

            // path-based bind
            showReport(head.find('[bind=' + i + ']'), data[i], tail, xbind);
        }
    }
};

var initPlayerList = function (count) {
    // remove items

    $('#report_players [bind]').remove();
    $('#report_list [xbind] [bind]').remove();

    // add items

    var spanLast = '<span class="last"><span></span>&nbsp;</span>';
    var spanNow = '<span class="now"><span></span></span>';

    for (var i = 0; i < count; ++i) {
        $('#report_players')
            .append('<th bind="' + i + '">' + spanNow + '</th>');
        $('#report_list [xbind]')
            .append('<td bind="' + i + '">' + spanLast + spanNow + '</td>');
    }
};

var showStatus = function (status) {
    $('#report_players [bind]').removeClass('next');

    for (var i = 0; status; ++i) {
        if (status & (1 << i)) {
            // done
            $('#report_players [bind=' + i + ']').addClass('next');
        }

        status &= ~(1 << i);
    }
};

var loadReport = function (game) {
    socket.emit('report', {
        game: game,
        uid: -1, // force reload
    });
};

// load from url hash
var loadHash = function () {
    var urlHash = window.location.hash.slice(1);
    if (urlHash) {
        loadReport(urlHash);
    }
};

var reloadReport = function () {
    if (!$('#report').hasClass('hide')) {
        socket.emit('report', {
            game: currentGame,
            uid: currentUid,
        });
    }
};

// auto refresh
setInterval(
    function () {
        if (connected) {
            reloadReport();
        }
    },
    30000
);

// load the game
loadHash();
$(window).on('hashchange', loadHash);

$('#report_refresh').click(reloadReport);

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

socket.on('report_early', function (data) {
    showStatus(data.status);

    showReport($('#report_decisions'), data.decisions, 'next');
    showReport($('#report_data_early'), data.data_early, 'next');
});

socket.on('report_player', function (data) {
    initPlayerList(data.players.length); // prepare DOM
    initReport(data.game, data.now_period, data.uid);

    showStatus(data.status);
    showReport($('#report_players'), data.players, 'now');

    if (data.now_period >= 3) {
        // showReport($('#report_decisions'), data.last_decisions, 'last');
        // showReport($('#report_data_early'), data.last_data_early, 'last');
        showReport($('#report_data'), data.last_data, 'last');
        showReport($('#report_decisions'), data.last_data_public.decisions, 'last', true);
        showReport($('#report_data_early'), data.last_data_public.data_early, 'last');
        showReport($('#report_data'), data.last_data_public.data, 'last', true);
    }

    showReport($('#report_settings'), data.settings, 'now');
    showReport($('#report_decisions'), data.decisions, 'now');
    showReport($('#report_data_early'), data.data_early, 'now');
    showReport($('#report_data'), data.data, 'now');
    showReport($('#report_decisions'), data.data_public.decisions, 'now', true);
    showReport($('#report_data_early'), data.data_public.data_early, 'now');
    showReport($('#report_data'), data.data_public.data, 'now', true);

    if (data.next_settings) {
        showReport($('#report_settings'), data.next_settings, 'next');

        var settingsStr = JSON.stringify(data.next_settings);
        if (settingsStr !== currentSettings) {
            $('#submit_price')
                .attr('min', data.next_settings.limits.price_min)
                .attr('max', data.next_settings.limits.price_max)
                .val(data.decisions.price);
            $('#submit_prod')
                .attr('min', 0)
                .attr('max', data.data_early.balance.size)
                .val(
                    Math.round(
                        data.data_early.balance.size
                        * data.data_early.production.prod_rate
                    )
                );
            $('#submit_prod_rate').text(
                Math.round(
                    100 * data.data_early.production.prod_rate
                )
            );
            $('#submit_mk')
                .attr('min', 0)
                .attr('max', data.next_settings.limits.mk_limit)
                .val(data.decisions.mk);
            $('#submit_ci')
                .attr('min', 0)
                .attr('max', data.next_settings.limits.ci_limit)
                .val(data.decisions.ci);
            $('#submit_rd')
                .attr('min', 0)
                .attr('max', data.next_settings.limits.rd_limit)
                .val(data.decisions.rd);
        }

        currentSettings = settingsStr;
        $('#submit input').attr('disabled', false);
    } else {
        currentSettings = undefined;
        $('#submit input').attr('disabled', true);
    }

    $('#submit').removeClass('hide');

    $('#report').removeClass('hide');
});

socket.on('report_public', function (data) {
    initPlayerList(data.players.length); // prepare DOM
    initReport(data.game, data.now_period, data.uid);

    showStatus(data.status);
    showReport($('#report_players'), data.players, 'now');

    if (data.now_period >= 3) {
        showReport($('#report_decisions'), data.last_data_public.decisions, 'last', true);
        showReport($('#report_data_early'), data.last_data_public.data_early, 'last');
        showReport($('#report_data'), data.last_data_public.data, 'last', true);
    }

    showReport($('#report_settings'), data.settings, 'now');
    showReport($('#report_decisions'), data.data_public.decisions, 'now', true);
    showReport($('#report_data_early'), data.data_public.data_early, 'now');
    showReport($('#report_data'), data.data_public.data, 'now', true);

    if (data.next_settings) {
        showReport($('#report_settings'), data.next_settings, 'next');
    }

    currentSettings = undefined;
    $('#submit').addClass('hide');

    $('#report').removeClass('hide');
});

socket.on('report_fail', function (data) {
    message('Game not found');
});

// submit

$('#submit_price').change(function () {
    $('#submit_price').val(
        0.01 * Math.round(100 * $('#submit_price').val())
    );
});

$('#submit_prod').change(function () {
    $('#submit_prod').val(
        Math.round($('#submit_prod').val())
    );
    $('#submit_prod_rate').text(
        Math.round(
            100 * $('#submit_prod').val() / $('#submit_prod').attr('max')
        )
    );
});

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

    socket.emit('submit', {
        game: currentGame,
        period: currentPeriod,
        price: parseFloat($('#submit_price').val()),
        prod: parseInt($('#submit_prod').val()),
        mk: parseFloat($('#submit_mk').val()),
        ci: parseFloat($('#submit_ci').val()),
        rd: parseFloat($('#submit_rd').val()),
    });
});

socket.on('submit_ok', function (data) {
    message('Submission ok');
});

socket.on('submit_decline', function (data) {
    message('Submission declined');
});

socket.on('submit_fail_player', function (data) {
    message('Submission not allowed');
});

socket.on('submit_fail_game', function (data) {
    message('Game not found');
});
