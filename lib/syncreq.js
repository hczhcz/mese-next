var define = function (name, builder) {
    if (window['module_' + name]) {
        throw Error('duplicate loading');
    }

    window['module_' + name] = {exports: {}};

    builder(
        function (module) {
            return window['module_' + module].exports
        },
        window['module_' + name]
    );
};
