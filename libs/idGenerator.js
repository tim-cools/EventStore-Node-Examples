var idGenerator = function idGeneratorConstructor(){
  
  var s4 = function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
               .toString(16)
               .substring(1);
  }

  var guid = function guid() {
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
  };

  var id = function id() { 
    return s4() + s4() + s4() + s4() + s4() + s4() + s4() + s4();
  };

  return {
    id: id,
    guid: guid
  }
}();

module.exports = idGenerator;

