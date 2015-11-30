'use strict';

var db = require('../helpers/db.js');
var {fetch_image, queue_image} = require('../helpers/fetch_image.jsx');
var _ = require('underscore');
var co = require('co');

var queue = co.wrap(function *(url){
  try {
    var item = yield queue_image(url);
  } catch(e) {
    if (e.code == 'ER_LOCK_DEADLOCK') return false;
    else throw e;
  }
  return item;
});

module.exports = {
  insert: function *({url}) {
    var item;
    //try to restart 3 times if catches deadlock
    for (let i = 0; i<3; i++) {
      item = yield queue(url);
      if (item !== false) break;
    }
    return item;
  },

  update: function *(id, data) {
    delete data.id;
    var selector = {id: id};
    var updateResult = yield db.update('images', selector, data);
    return updateResult ? yield db.get('images', selector) : null;
  },

  delete: function *(id) {
    return yield db.delete('images', {id: parseInt(id)});
  },

  get: function *(id) {
    return yield db.get('images', {id: parseInt(id)});
  },

  getMany: function *(id) {
    return yield db.getMany('images');
  }

};
