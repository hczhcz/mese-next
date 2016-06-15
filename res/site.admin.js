'use strict';

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

// users

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
        newPassword: sha($('#admin_password_new').val()),
    });
});
