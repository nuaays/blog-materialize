var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

// plugins
var session = require('express-session');
var config = require('./config');
var User = require('./models/user');

// route
var index = require('./routes/index');
var users = require('./routes/users');
var articles = require('./routes/articles');
var confirm = require('./routes/confirm');
var forgot = require('./routes/forgot');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: config.secret,
}));

app.use(function(req, res, next) {
  if (!req.session.user && req.cookies.rememberMe) {
    var remember = req.cookies.rememberMe;
    User.findById(remember.uid, function(err, user) {
      if (user && user.compareUsernameToken(remember.token)) {
        req.session.user = user;
      }
      next();
    });
  } else {
    next();
  }
});

app.use(function(req, res, next) {
  res.locals.user = req.session.user || null;
  next();
});

app.use('/', index);
app.use('/users', users);
app.use('/articles', articles);
app.use('/forgot', forgot);
app.use('/confirm', confirm);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;