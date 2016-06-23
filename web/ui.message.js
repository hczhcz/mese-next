'use strict';

define('ui.message', function (require, module) {
    var bind = require('ui.bind');

    var windowActive = false;

    var showMessage = function () {
        if ($('#message p').length == 0) {
            return;
        }

        $('#message')
            .clearQueue()
            .stop()
            .removeClass('hide')
            .attr('style', '');

        // IE8 workaround
        if (
            $('#message').position().left * 2 + 1 >= $(window).width()
            && $('#message').position().top * 2 + 1 >= $(window).height()
        ) {
            $('#message').css(
                'margin-left',
                Math.round(-0.5 * $('#message').outerWidth(true)) + 'px'
            );
            $('#message').css(
                'margin-top',
                Math.round(-0.5 * $('#message').outerHeight(true)) + 'px'
            );
        }
    };

    var removeMessage = function () {
        $('#message')
            .addClass('hide')
            .empty();
    };

    var hideMessage = function () {
        if (windowActive) {
            $('#message')
                .clearQueue()
                .stop()
                .delay(2000)
                .fadeOut(2000, removeMessage);
        }
    };

    $(window).focus(function () {
        windowActive = true;
        hideMessage();
    });

    $(window).blur(function () {
        windowActive = false;
    });

    $('#message').hover(showMessage, hideMessage);
    $('#message').click(removeMessage);
    $('#message').on('touchstart', removeMessage);

    module.exports = function (str) {
        $('#message').append(
            $('<p />').text(str)
        );
        if ($('#message p').length > 5) {
            $('#message p:first').remove();
        }

        bind.variable('message', str);

        showMessage();
        hideMessage();
    };
});
