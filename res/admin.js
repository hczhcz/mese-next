'use strict';

// admin

$('#admin_message_submit').click(function () {
    socket.emit('admin_message', {
        message: $('#admin_message_content').val(),
    });
});

$('#admin_list_refresh').click(function () {
    socket.emit('admin_list');
});

socket.on('admin_auth_ok', function (data) {
    $('#admin').removeClass('hide');

    socket.emit('admin_list');
});

socket.on('admin_list_data', function (data) {
    // notice: use html string when data size becomes large

    $('#admin_users').empty();
    for (var i in data.users) {
        $('#admin_users').prepend(
            $('<option>').text(data.users[i])
        );
    }

    $('#admin_games').empty();
    for (var i in data.games) {
        $('#admin_games').prepend(
            $('<option>').text(data.games[i])
        );
    }
});

// admin: users

$('#admin_users').change(function () {
    var list = $('#admin_users').val();

    if (list.length == 1) {
        $('#admin_login_user').val(list[0]);
        $('#admin_transfer_user').val(list[0]);
    } else if (list.length > 1) {
        $('#admin_init_players').val(list.join(','));
    }
});

$('#admin_login_submit').click(function () {
    socket.emit('admin_login', {
        user: $('#admin_login_user').val(),
    });
});

$('#admin_password_submit').click(function () {
    socket.emit('admin_password', {
        newPassword: $('#admin_password_new').val(),
    });
});

// admin: games

$('#admin_games').change(function () {
    $('#admin_game_game').val($('#admin_games').val());
});

var parseSettings = function (text) {
    var data = text.split(/-{3,}/);
    var result = [];

    for (var i in data) {
        result.push(eval('({' + data[i] + '})'));
    }

    return result;
};

$('#admin_game_submit').click(function () {
    // load player / public report
    loadReport($('#admin_game_game').val());
});

$('#admin_report_submit').click(function () {
    if (currentGame) {
        // load summary report
        socket.emit('admin_report', {
            game: currentGame,
        });
    } else {
        // TODO
    }
});

$('#admin_transfer_submit').click(function () {
    if (currentGame) {
        socket.emit('admin_transfer', {
            game: currentGame,
            user: $('#admin_transfer_user').val(),
        });
    } else {
        // TODO
    }
});

$('#admin_init_submit').click(function () {
    socket.emit('admin_init', {
        game: $('#admin_init_game').val(),
        players: $('#admin_init_players').val().split(','),
        preset: $('#admin_init_preset').val(),
        settings: parseSettings($('#admin_settings').val()),
    });
});

$('#admin_alloc_submit').click(function () {
    if (currentGame) {
        socket.emit('admin_alloc', {
            game: currentGame,
            settings: parseSettings($('#admin_settings').val()),
        });
    } else {
        // TODO
    }
});

socket.on('admin_report_data', function (data) {
    $('#admin_report').val(JSON.stringify(data)); // TODO: format?
});

socket.on('admin_report_fail', function (data) {
    message('Game not found');
});

socket.on('admin_transfer_ok', function (data) {
    message('Game transferred');
});

socket.on('admin_transfer_fail_player', function (data) {
    message('Transferring not allowed');
});

socket.on('admin_transfer_fail_game', function (data) {
    message('Game not found');
});

socket.on('admin_init_fail_number', function (data) {
    message('Player count not supported');
});

socket.on('admin_init_fail_game', function (data) {
    message('Game exists');
});

socket.on('admin_init_fail_invite', function (data) {
    message('Invition not allowed: ' + data);
});

socket.on('admin_init_ok', function (data) {
    message('Game created');
});

socket.on('admin_alloc_ok', function (data) {
    message('Period allocated');
});

socket.on('admin_alloc_fail_game', function (data) {
    message('Game not found');
});
