var config = function configConstructor() {

    var environment = process.env.NODE_ENV
        ? process.env.NODE_ENV   // set by jasmine
        : process.env.PORT       // set by IISNODE
        ? 'production'
        : 'development';

    return {
        environment: environment,
        logLevel: 'debug', // environment != 'production' ? 'debug' : 'info',
        eventStore: {
            machine: 'localhost',
            httpPort: 2113,
            userName: 'admin',
            password: 'changeIt',
            batchSize: 1
        }
    }
}();

module.exports = config;
