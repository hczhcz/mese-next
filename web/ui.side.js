'use strict';

define('ui.side', function (require, module) {
    var sideEnabled = true;

    var show = function () {
        if (!sideEnabled) {
            sideEnabled = true;

            $('#side')
                .css('overflow-y', 'auto')
                .clearQueue()
                .stop()
                .animate({left: '0rem'}, function () {
                    // IE8 workaround
                    if ($('#side').position().left !== 0) {
                        $('#side').css('left', '0');
                        $('body').css('padding-left', '16em');
                    }
                });
            $('body')
                .clearQueue()
                .stop()
                .animate({'padding-left': '16rem'});
        }
    };

    var hide = function () {
        if (sideEnabled) {
            sideEnabled = false;

            $('#side')
                .css('overflow-y', 'hidden')
                .clearQueue()
                .stop()
                .animate({left: '-15.5rem'}, 1000, function () {
                    // IE8 workaround
                    if ($('#side').position().left === 0) {
                        $('#side').css('left', '-15.5em');
                        $('body').css('padding-left', '0.5em');
                    }
                });
            $('body')
                .clearQueue()
                .stop()
                .animate({'padding-left': '0.5rem'}, 1000);
        }
    };

    $('#side').click(show);
    $('#side').on('touchstart', show);
    $('#side').dblclick(hide);
    $('#side_hide').click(function (event) {
        hide();
        event.stopPropagation();
    });
    $('#util td').dblclick(function (event) {
        event.stopPropagation();
    });
});
