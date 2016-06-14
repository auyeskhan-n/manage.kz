angular.module('MyApp').factory('MySocket', function (socketFactory) {
        return socketFactory({
            ioSocket: io.connect('localhost:3000/')
            // app.automato.me
            // nodejs2 178.62.200.230
            // nodejs2 188.166.12.98:3222
            // nodejs1 188.166.2.221:3222
        });
    });
