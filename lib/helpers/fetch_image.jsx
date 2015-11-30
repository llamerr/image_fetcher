var d = require('debug');
var http = require('q-io/http');
var url_parser = require('url');
var crypto = require('crypto');
var fs = require('q-io/fs');
var uuid = require('node-uuid');
var mime = require('mime-types');
var co = require('co');
var pool = require('../helpers/db').pool;

var is_bar = false;
if (is_bar) var ProgressBar = require('progress');


function validateImage(type, size) {
  //limit to 15Mb
  if (type && size < 15 * 1024 * 1024) {
    var split_type = type.split('/');
    if (split_type.length && split_type[0] == 'image') return true;
  }
  return false;
}

var downloadImage = function* (url, debug) {
  debug(`Downloading "${url}":`);
  var {body, headers: {'content-type': ctype, 'content-length': clength}} = yield http.request({url});
  if (!validateImage(ctype, clength)) throw new Error(`Invalid file: ${ctype}, ${clength}`);
  if (is_bar) {
    var bar = new ProgressBar('[:bar] :percent :etas', {
      complete: '=',
      incomplete: ' ',
      width: 40,
      total: parseInt(clength)
    });
  }

  var ext = mime.extension(ctype),
    uuid_v1 = uuid.v1(),
    path = "/tmp/" + uuid_v1 + "." + ext;

  var writer = yield fs.open(path, 'w');
  var sum = 0, last_sum = 0;
  yield body.forEach(function (chunk) {
    sum += chunk;
    //each 5kb
    if (sum - last_sum > 5 * 1024) {
      debug(`Downloading: ${~~(sum/1024)}/${~~(clength/1024)}`);
      last_sum = sum;
    }
    if (is_bar) bar.tick(chunk.length);
    return writer.write(chunk);
  });
  return {path, filename: uuid_v1, ext};
}

var getColor = (function () {
  var color = 1;
  return function () {
    if (color == 6) color = 1;
    else color++;
    return color;
  }
})();
var getFile = (function () {
  var file = 1;
  return function () {
    return file++;
  }
})();
var getDebug = (function () {
  var debug = d(`image_fetcher:` + getFile());
  debug.color = getColor();
  return debug;
});

/**
 * Fetch image and return id AFTERWARDS
 * @param url
 * @returns {*}
 */
var fetch_image = function* (url) {
  var debug = getDebug();
  debug(`Fetching "${url}":`);
  var state;
  var db = yield pool.getConnection();
  yield db.query('START TRANSACTION');
  try {
    //check ulr in db, set id and state (selected or created)
    var [rows] = yield db.query('SELECT `id`, `state` FROM `images` WHERE `source` = ? FOR UPDATE', [url]);
    if (rows.length) {
      ({id, state} = rows[0]);
      debug(`Record found: ${id}, ${state}`);
    }
    else {
      //state is set to loading to prevent concurrent loading
      [{insertId: id}] = yield db.query("INSERT INTO `images`(`source`, `state`) VALUES (?, 'LOADING')", [url]);
      //state is faked as failure to ease algorithm
      state = "FAILURE";
      debug(`Adding new record: ${id}, ${state}`);
    }
    //if state is `success` return result
    if (state == 'SUCCESS') {
      yield db.query('COMMIT');
      return id;
    }
    //else if it's not loading we need to load image
    else if (state == 'FAILURE') {
      try {
        var {path, filename, ext} = yield downloadImage(url, debug);
        yield fs.rename(path, `./images/${filename}.${ext}`);
        debug(`File saved: ${filename}.${ext}`);
        debug(`Updating state to success`);
        yield db.query("UPDATE `images` SET `state` = 'SUCCESS', filename = ? WHERE source = ?", [`${filename}.${ext}`, url]);
        yield db.query('COMMIT');
        return id;
      } catch (err) {
        debug(`Error fetching file, reverting state`, err);
        yield db.query("UPDATE `images` SET `state` = 'FAILURE' WHERE source = ?", [url]);
        yield db.query('COMMIT');
        throw err;
      }
    }
    //else if it's already loading then throw an exception
    else {
      debug(`This url is already loading`);
      throw "LOADING";
    }
  } catch (err) {
    debug(`Rolling back`);
    yield db.query('ROLLBACK');
    throw err;
  }
}

/**
 * Fetch image in background and return id IMMEDIATELY
 * @param url
 * @returns {*}
 */
var queue_image = function* (url) {
  var debug = getDebug();
  debug(`Fetching "${url}":`);
  var state;
  var {protocol, hostname} = url_parser.parse(url);
  var origin = `${protocol}//${hostname}`;
  var url_md5sum = crypto.createHash('md5').update(url).digest('hex');
  var db = yield pool.getConnection();
  yield db.query('START TRANSACTION');
  try {
    //check ulr in db, set state (selected or created)
    var [rows] = yield db.query(
      'SELECT `state` FROM `images` WHERE `source_md5` = ? LIMIT 1 FOR UPDATE',
      [url_md5sum]
    );
    if (rows.length) {
      ({state} = rows[0]);
      debug(`Record found: ${state}`);
    }
    else {
      //state is set to loading to prevent concurrent loading
      yield db.query(
        "INSERT INTO `images`(`source`, `state`, `source_md5`) VALUES (?, 'LOADING', ?)",
        [url, url_md5sum]
      );
      //state is faked as failure to ease algorithm
      state = "FAILURE";
      debug(`Adding new record: ${state}`);
    }
    //if it's not yet loaded, load it in background
    if (state == 'FAILURE') {
      process.nextTick(co.wrap(function *() {
        try {
          var {path, filename, ext} = yield downloadImage(url, debug);
          yield fs.rename(path, `./images/${filename}.${ext}`);
          debug(`File saved: ${filename}.${ext}`);
          debug(`Updating state to success`);
          yield db.query("UPDATE `images` SET `state` = 'SUCCESS', filename = ? WHERE source = ?", [`${filename}.${ext}`, url]);
          db.release();
          return url_md5sum;
        } catch (err) {
          debug(`Error fetching file, reverting state`, err);
          yield db.query("UPDATE `images` SET `state` = 'FAILURE' WHERE source = ?", [url]);
          throw err;
        }
      }));
    }
    yield db.query('COMMIT');
    db.release();
    return url_md5sum;
  } catch (err) {
    debug(`Rolling back`, err);
    yield db.query('ROLLBACK');
    db.release();
    throw err;
  }
}

module.exports = {fetch_image, queue_image};
var url;
//url = "https://cs7008.vk.me/v7008291/2ef8a/7g-Td6k-JRA.jpg";
url = "http://i.livelib.ru/boocover/1000448369/o/7840/boocover.jpeg";
//url = "http://img0.joyreactor.cc/pics/post/full/%D0%BA%D0%BE%D1%81%D0%BF%D0%BB%D0%B5%D0%B9-%D0%94%D0%B5%D1%80%D0%B5%D0%B2%D0%BD%D1%8F-%D0%94%D1%83%D1%80%D0%B0%D0%BA%D0%BE%D0%B2-2633632.jpeg";
//co(fetch_image, url).then(function(id){ debug(`Done, id is: ${id}`) })
//co(queue_image, url).then(function(id){ debug(`Done, id is: ${id}`) })