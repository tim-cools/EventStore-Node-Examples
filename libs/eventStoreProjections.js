var logger = require('../libs/logger');

var async = require('async');
var unirest = require('unirest');
var _ = require('lodash');

var eventStoreProjections = function eventStoreProjectionsConstructor() {

    var get = function get(name, callback) {

        unirest.get('http://localhost:2113/projection/' + name)
            .headers({
                'Content-Type': 'application/json'
            })
            .auth('admin', 'changeit')
            .send()
            .end(function (response) {
                logger.response(response);
                callback(
                    response.code != 200 && response.code != 404,
                    response.code == 200 ? response.body : null);
            });
    };

    var getState = function get(name, callback) {

        getAllState(name, function (error, data) {
            if (!error) {
                var projection = _.find(data.projections, { 'name': name })
                callback(projection == null, projection);
            }
            else {
                callback(error);
            }
        });
    };

    var getAllState = function get(name, callback) {

        unirest.get('http://localhost:2113/projections/all-non-transient')
            .headers({
                'Content-Type': 'application/json'
            })
            .auth('admin', 'changeit')
            .send()
            .end(function (response) {
                logger.response(response);
                callback(response.code != 200, response.body);
            });
    };

    var add = function add(name, projection, callback) {

        logger.debug('POST Projection: ' + name);

        post('/projections/continuous?name=' + name + '&emit=yes&checkpoints=yes&enabled=yes', projection, callback);
    };

    function updateProjection (name, projection, existing, callback) {

        if (existing) {
            if (existing == projection) {
                logger.debug('Projection does already exist and is same: ' + name);
                callback();
                return;
            }
            put(name, projection, callback);
        }
        else {
            add(name, projection, callback);
        }
    }

    var put = function put(name, projection, callback) {

        logger.debug('PUT Projection: ' + name);

        unirest.put('http://localhost:2113/projection/' + name + '/query?&emit=yes&checkpoints=yes&enabled=yes')
            .headers({
                'Content-Type': 'application/json'
            })
            .auth('admin', 'changeit')
            .send(projection)
            .end(function (response) {
                logger.response(response);
                callback(response.code != 200);
            });
    };

    var post = function post(name, data, callback) {

        unirest.post('http://localhost:2113/' + name)
            .headers({
                'Content-Type': 'application/json'
            })
            .auth('admin', 'changeit')
            .send(data)
            .end(function (response) {
                logger.response(response);
                callback && callback(response.code != 201 && response.code != 200);
            });
    };

    var enableIfStopped = function (name, currentProjectionState, callback) {

        if (!currentProjectionState) {
            callback();
        }

        if (currentProjectionState.status == 'Stopped') {
            post('projection/' + name + '/command/enable', null, callback);
        }
        else {
            logger.info('projection already started: ' + name);
            callback();
        }
    };

    var ensure = function ensure(name, projection, callback) {

        logger.log('debug', 'ensure %s', name);

        async.waterfall([
            async.apply(get, name),
            async.apply(updateProjection, name, projection)
        ], function (error) {

            if (error) {
                logger.error('Error occurred while ensuring: ' + name);
            }
            else {
                logger.info('Projection ensured: ' + name);
            }

            callback(error);
        });
    };

    var enable = function (name, callback) {

        logger.log('debug', 'enable %s', name);

        async.waterfall([
            async.apply(getState, name),
            async.apply(enableIfStopped, name)
        ], function (error) {

            if (error) {
                logger.error('Error occurred while enable: ' + name);
            }
            else {
                logger.info('projection enabled: ' + name);
            }

            callback(error);
        });
    };

    return {
        get: get,
        enable: enable,
        ensure: ensure
    };
}();

module.exports = eventStoreProjections;