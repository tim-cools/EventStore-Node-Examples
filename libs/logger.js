var util = require('util');
var winston = require('winston');

var config = require('../config');

var colors = {
    debug: 'white',
    info: 'green',
    warn: 'yellow',
    error: 'red',
    fatal: 'red'
};

var levels = {
    debug: 1,
    info: 2,
    warn: 3,
    error: 4,
    fatal: 5
};

var createTransports = function createTransports() {

    var transports = [];
    transports.push(new (winston.transports.Console)({
        level: config.logLevel,
        colorize: true,
        timestamp: true
    }));

    if (config.environment != 'test') {
        transports.push(new (winston.transports.File)({
            filename: '../logs/s9server.log',
            level: config.logLevel,
            handleExceptions: true,
            json: false
        }));
    }

    return transports;
};

var logger = new (winston.Logger)({
    colors: colors,
    levels: levels,
    transports: createTransports()
});

winston.addColors(colors);

// Extend logger object to properly log 'Error' types
var baseLogger = logger.log;

logger.log = function (level, msg) {
    var objType = Object.prototype.toString.call(msg);
    if (objType === '[object Error]') {
        baseLogger.call(logger, level, msg.stack);
    } else {
        baseLogger.apply(logger, arguments);
    }
};

logger.response = function (response) {

    if (!response) {

        logger.error('response empty \'%j\'', response);
        return;
    }

//    var responseFormatted = util.format("Code: %d Response: %s", response.code, response.body)
    var responseFormatted = util.format("Code: %d Response: %s", response.code, { })

    if (response.code != 200 && response.code != 201) {
        logger.warn('response invalid %s', responseFormatted);
    }
    else {
        logger.info('response %s', responseFormatted);
    }
};

process.on('uncaughtException', function ( err ) {
    logger.fatal('An uncaughtException was found, the program will end.');
    logger.fatal(err);

    process.exit(1);
});


module.exports = logger;
