var repository = require("../libs/eventRepository");
var idGenerator = require("../libs/idGenerator");

describe("when using a repository", function () {

    describe("when loading the events of an aggregate", function () {

        var result;

        beforeEach(function (done) {
            var id = 'test-' + idGenerator.id();
            var events = [
                { name: 'event1', body: { a: 1, b: '3' } },
                { name: 'event2', body: { a: 2, b: '2' } },
                { name: 'event3', body: { a: 3, b: '1' } }
            ];

            repository.save(id, -1, events, function (error) {
                repository.load(id, function (error, events) {
                    result = events;
                    done();
                });
            });
        });

        it("should return the store events", function () {
            expect(result.events).toEqual([
                { name: 'event1', body: { a: 1, b: '3' } },
                { name: 'event2', body: { a: 2, b: '2' } },
                { name: 'event3', body: { a: 3, b: '1' } }
            ]);
        });

        it("should return the correct version", function () {
            expect(result.version).toEqual('2');
        });
    });

    describe("when loading the events of a large aggregate", function () {

        var result;

        beforeEach(function (done) {
            var id = 'test-' + idGenerator.id();
            var events = [
                { name: 'event1', body: { a: 1, b: '12' } },
                { name: 'event2', body: { a: 2, b: '11' } },
                { name: 'event3', body: { a: 3, b: '10' } },
                { name: 'event4', body: { a: 4, b: '9' } },
                { name: 'event5', body: { a: 5, b: '8' } },
                { name: 'event6', body: { a: 6, b: '7' } },
                { name: 'event7', body: { a: 7, b: '6' } },
                { name: 'event8', body: { a: 8, b: '5' } },
                { name: 'event9', body: { a: 9, b: '4' } },
                { name: 'event10', body: { a: 10, b: '3' } },
                { name: 'event11', body: { a: 11, b: '2' } },
                { name: 'event12', body: { a: 12, b: '1' } }
            ];

            repository.save(id, -1, events, function (error) {
                repository.load(id, function (error, events) {
                    result = events;
                    done();
                });
            });
        });

        it("should return the store events", function () {
            expect(result.events).toEqual([
                { name: 'event1', body: { a: 1, b: '12' } },
                { name: 'event2', body: { a: 2, b: '11' } },
                { name: 'event3', body: { a: 3, b: '10' } },
                { name: 'event4', body: { a: 4, b: '9' } },
                { name: 'event5', body: { a: 5, b: '8' } },
                { name: 'event6', body: { a: 6, b: '7' } },
                { name: 'event7', body: { a: 7, b: '6' } },
                { name: 'event8', body: { a: 8, b: '5' } },
                { name: 'event9', body: { a: 9, b: '4' } },
                { name: 'event10', body: { a: 10, b: '3' } },
                { name: 'event11', body: { a: 11, b: '2' } },
                { name: 'event12', body: { a: 12, b: '1' } }
            ]);
        });

        it("should return the correct version", function () {
            expect(result.version).toEqual('11');
        });
    });

    describe("when saving the event of an aggregate given version is correct", function () {

        var result;

        beforeEach(function (done) {
            var id = 'test-' + idGenerator.id();
            var events = [
                { name: 'event1', body: { a: 1, b: '3' } },
                { name: 'event2', body: { a: 2, b: '2' } },
                { name: 'event3', body: { a: 3, b: '1' } }
            ];

            repository.save(id, -1, events, function (error) {
                expect(error).toBe(false);
                repository.save(id, 2, events, function (error) {
                    result = error;
                    done();
                });
            });
        });

        it("should succeed", function () {
            expect(result).toBe(false);
        });
    });

    describe("when saving the event of an aggregate given version is wrong", function () {

        var result;

        beforeEach(function (done) {
            var id = 'test-' + idGenerator.id();
            var events = [
                { name: 'event1', body: { a: 1, b: '3' } },
                { name: 'event2', body: { a: 2, b: '2' } },
                { name: 'event3', body: { a: 3, b: '1' } }
            ];

            repository.save(id, -1, events, function (error) {
                repository.save(id, 4, events, function (error) {
                    result = error;
                    done();
                });
            });
        });

        it("should fail", function () {
            expect(result).toBe(true);
        });
    });

    describe("when loading an empty aggregate", function () {

        var result;

        beforeEach(function (done) {
            var id = 'test-' + idGenerator.id();

            repository.load(id, function (error, events) {
                result = events;
                done();
            });
        });

        it("should return the no events", function () {
            expect(result.events).toEqual([ ]);
        });

        it("should return the correct version", function () {
            expect(result.version).toEqual('-1');
        });
    });

    describe("when loading the last event of a stream", function () {

        var result;

        beforeEach(function (done) {
            var id = 'test-' + idGenerator.id();
            var events = [
                { name: 'event1', body: { a: 1, b: '3' } },
                { name: 'event2', body: { a: 2, b: '2' } },
                { name: 'event3', body: { a: 3, b: '1' } }
            ];

            repository.save(id, -1, events, function (error) {
                repository.loadLast(id, function (error, events) {
                    result = events;
                    done();
                });
            });
        });

        it("should return the last stored event", function () {
            expect(result.event).toEqual({ name: 'event3', body : { a : 3, b : '1' } });
        });

        it("should return the correct version", function () {
            expect(result.version).toEqual('2');
        });
    });
});