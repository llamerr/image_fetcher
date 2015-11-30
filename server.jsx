'use strict';

require('colors');
var koa = require('koa');
var surface = require('surface');
var serve = require('koa-static');
var cors = require('koa-cors');
var bodyParser = require('koa-bodyparser');
var app = koa();
var corsConfig = {
    origin: '*',
    methods: ['PUT', 'POST', 'GET', 'DELETE']
};
app.use(cors(corsConfig));
app.use(bodyParser());
app.use(serve('doc'));
app.use(function *(next){
  //console.log("\nnew request".cyan, this.request);
  yield next;
  //console.log("\nrespond with".cyan, this.response);
})

surface(app, {format: 'json'});
app.listen(3000);
