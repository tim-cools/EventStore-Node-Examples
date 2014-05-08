var _ = require('lodash');
var unirest = require('unirest');

var idGenerator = require('../libs/idGenerator');
var logger = require('../libs/logger');
var config = require('../config');

function getBaseUrl() {
    return 'http://' + config.eventStore.machine + ':' + config.eventStore.httpPort;
}

function parseVersion (headers) {
    var etag = headers.etag;
    return etag.substr(1, etag.length - 2).split(';')[0];
};

function parseEvents(body) {
    var eventsData = [];
    _.forEachRight(body.entries, function(event) {
        eventsData.push({
            name: event.eventType,
            body: JSON.parse(event.data)
        })
    });
    return eventsData;
}

function appendToResponse(response, responseData, body) {
    var events = parseEvents(body);
    _.forEachRight(events, function(event) {
        responseData.events.unshift(event);
    })
}

function parseEventsResponse(headers, body) {
    return {
        version: parseVersion(headers),
        events: parseEvents(body)
    }
}

function load(id, callback) {
    var url = getBaseUrl() + '/streams/' + id + '/head/backward/' + config.eventStore.batchSize + '?embed=body';
    loadUrl(url, null, callback);
}

function loadUrl(url, responseData, callback) {
    logger.debug('loadUrl: ' + url);
    unirest.get(url)
        .headers({ 'Content-Type': 'application/json' })
        .send()
        .end(function (response) {

            if (response.code == 404) {
                return callback && callback(null, { version: '-1', events: [ ] });
            }

            if (response.code != 200) {
                return callback && callback(true, 'invalid code: ' + response.code);
            }

            var body = JSON.parse(response.body);
            if (!responseData){
                responseData = parseEventsResponse(response.headers, body);
            } else {
                appendToResponse(response, responseData, body);
            }

            var nextUrl = getNextUrl(body);
            if (nextUrl) {
                loadUrl(nextUrl, responseData, callback)
            } else {
                return callback && callback(null, responseData);
            }
        });
}

function getNextUrl(body) {
    if (!body || !body.links) return null;
    var link = _.find(body.links, function(link) {
        return link.relation == "next";
    });
    return link != null ? link.uri + "?embed=body" : null;
}

function parseEventResponse(headers, body) {
    logger.warn(body);
    return {
        version: parseVersion(headers),
        event: {
            name: body.content.eventType,
            body: body.content.data
        }
    }
};

function getEventResponseData(response) {
    if (response.code == 200) {
        return parseEventResponse(response.headers, JSON.parse(response.body));
    }
    return null;
};

function loadLast(id, callback) {

    var url = getBaseUrl() + '/streams/' + id + '/head';

    unirest.get(url)
        .headers({ 'Content-Type': 'application/json' })
        .send()
        .end(function (response) {

            logger.response(response);
            var responseData = getEventResponseData(response);
            callback && callback(responseData == null, responseData);
        });
};

var makePostEvent = function (events, callback) {

    var eventsData = _.map(events, function(event) {
        return {
            "eventId": idGenerator.guid(),
            "eventType": event.name,
            "data": event.body
        }
    });

    return JSON.stringify(eventsData);
};

var save = function (id, version, events, callback) {

    if (events.length == 0) {
        logger.log('warn', 'No events to save %s', id);
        return callback && callback(false);
    }
    logger.log('debug', 'Save event %s', id);

    var eventsData = makePostEvent(events);

    unirest.post(getBaseUrl() + '/streams/' + id)
        .headers({
            'Content-Type': 'application/json',
            'ES-ExpectedVersion': version
        })
        .send(eventsData)
        .end(function (response) {
            logger.response(response);
            callback && callback(response.code != 201);
        });
};

module.exports = {
    load: load,
    loadLast: loadLast,
    save: save
};