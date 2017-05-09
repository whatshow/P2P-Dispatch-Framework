/*** 模块引用 ***/
var express = require('express');
var app = express();
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
/*** 配置引用 ***/
var serverConfig = require("./Config/server");
var users = require('./Servlets/users');
var libs = {
  middleware:{
    md5:  require("./Libs/MiddleWare/md5")
  }
};
var servlets = {
  md5:  require('./Servlets/ResourceMD5')
};


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /Resource
//app.use(favicon(path.join(__dirname, 'Resource', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(serverConfig.resource.url, libs.middleware.md5, express.static(path.join(__dirname, 'Resource')));

//注册所有Servlets
//app.use('/', Servlets);
//app.use('/users', users);
app.use('/md5', servlets.md5);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
