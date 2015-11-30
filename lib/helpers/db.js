'use strict';

var _ = require('underscore');

var config = require('../../config');
var mysql = require('mysql-co');
var pool = mysql.createPool({
  host: "localhost",
  user: config.mysql_user.login,
  password: config.mysql_user.pass,
  database: "images",
  connectionLimit: 5,
  acquireTimeout: 10000,
  waitForConnections: true
});

function exitHandler(err) {
  if (err) console.log(err.stack);
  //if not all connections are closed
  if (!pool._closed) {
    pool.end();
    console.log('\nclosed database connection');
  }
  process.exit();
}
//do something when app is closing
process.on('exit', exitHandler);
//catches ctrl+c event
process.on('SIGINT', exitHandler);

module.exports = {

  pool,

  insert: function *(type, data) {
    data = this.sanitizeData(data);
    var db = yield pool.getConnection();
    var result = yield db.query('INSERT INTO ?? SET ?', [type, data]);
    return result.insertId;
  },

  insertMany: function *(type, items) {
    var insertIds = [];

    for (var i = 0; i < items.length; i++) {
      insertIds.push(yield this.insert(type, items[i]));
    }
    return insertIds;
  },

  update: function *(type, selector, modifier, customSelector) {
    modifier = this.sanitizeData(modifier);
    selector = _.isArray(selector) ? selector : [selector];
    var query = 'UPDATE ?? SET ? WHERE ' + (customSelector || '?');
    var params = _.union([type, modifier], selector);
    var db = yield pool.getConnection();
    return yield db.query(query, params);
  },

  delete: function *(type, selector, customSelector) {
    selector = _.isArray(selector) ? selector : [selector];
    var query = 'DELETE FROM ?? WHERE ' + (customSelector || '?');
    var params = _.union([type], selector);
    var db = yield pool.getConnection();
    var result = yield db.query(query, params);
    return null;
  },

  get: function *(type, selector, customSelector) {
    selector = _.isArray(selector) ? selector : [selector];
    var query = 'SELECT * FROM ?? WHERE ' + (customSelector || '?');
    var params = _.union([type], selector);
    var db = yield pool.getConnection();
    var result = yield db.query(query, params);
    return result.length ? result[0] : null;
  },

  getWithSearch: function *(type, selector, customSelector) {
    selector = _.isArray(selector) ? selector : [selector];
    var query = 'SELECT * FROM ?? WHERE ' + (customSelector || '?');
    var params = _.union([type], selector);
    var db = yield pool.getConnection();
    var result = yield db.query(query, params);
    return result.length ? result : [];
  },

  getMany: function *(type) {
    var query = 'SELECT * FROM ??';
    var params = [type];
    var db = yield pool.getConnection();
    var result = yield db.query(query, params);
    return result.length ? result[0] : [];
  },

  sanitizeData: function (object) {
    var self = this;
    var newObject = {};
    _.each(object, function (value, index) {
      newObject[self.camelToUnder(index)] = value;
    });
    return newObject;
  },

  camelToUnder: function (string) {
    return string.replace(/\W+/g, '_').replace(/([a-z\d])([A-Z])/g, '$1_$2').toLowerCase();
  }

};
