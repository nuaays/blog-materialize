var express = require('express');
var router = express.Router();
var csrf = require('csurf');
var csrfProtection = csrf();
var Promise = require('bluebird');
var marked = require('marked');
var util = require('util');

var _ = require('lodash');

var authority = require('../modules/authority');
var config = require('../modules/config');
var Article = require('../models/article');
var Comment = require('../models/comment');

/* GET users listing. */
router.get('/', csrfProtection, function(req, res, next) {
  res.redirect('/articles/page/1');
});

router.get('/page/:pageNum', csrfProtection, function(req, res, next) {
  var pageNum = parseInt(req.params.pageNum);
  if (pageNum < 1) return res.redirect('/articles/page/1');

  var start = (pageNum - 1) * config.pageSize;
  var queryList = Article.find().sort({'updateDate': 'desc'}).skip(start).limit(config.pageSize).exec();
  var queryCount = Article.count({}).exec();
  var queryAll = Article.find().exec();

  Promise.all([queryList, queryCount, queryAll]).spread(function(articles, count, allArticles) {
    var categories = [];
    allArticles.forEach(function(doc) {
      categories = categories.concat(doc.categories);
    });

    var uniqAndSort = _.filter(categories, function(tag) {
      return tag !== '';
    }).sort();

    var uniqAndStatisc = [];
    var target;
    _.map(uniqAndSort, function(tag) {
      target = _.find(uniqAndStatisc, function(o) {return o.name === tag;});
      if (target) {
        target.count++;
      } else {
        uniqAndStatisc.push({name: tag, count: 1});
      }
    });

    var pageSum = Math.ceil(count / config.pageSize);
    if (pageNum > pageSum) return res.redirect('/articles/page/' + pageSum);
    res.render('articles/articles', {
      articleList: articles,
      csrfToken: req.csrfToken(),
      pageNum: pageNum,
      pageSum: pageSum,
      categories: uniqAndStatisc,
      pageBarSize: config.pageBarSize
    });
  }).catch(function(reason) {
    res.send(util.inspect(reason));
  });
});

router.get('/passage/:articleId', csrfProtection, function(req, res, next) {
  Promise.all([Article.findById(req.params.articleId).exec(), Comment.find({'article': req.params.articleId}).exec()]).spread(function(article, comments) {
    res.render('articles/passage', {
      csrfToken: req.csrfToken(),
      article: article,
      articleComments: comments
    });
  }).catch(function(reason) {
    res.send(util.inspect(reason));
  });
});

router.get('/edit', authority.checkIfAdmin);
router.get('/edit', csrfProtection, function(req, res, next) {
  res.render('articles/edit', {csrfToken: req.csrfToken()});
});

router.post('/edit/addnew', csrfProtection, authority.checkIfAdmin);
router.post('/edit/addnew', csrfProtection, function(req, res, next) {
  var status = {
    success: false,
    data: {
      title: req.body.title,
      err: null,
    }
  };

  if (!req.body.title || !req.body.content || !req.body.intro) {
    status.data.err = 'Incomplete information';
    return res.send(status);
  }

  var nowtime = Date();
  var articleInfo = {
    title: req.body.title,
    content: req.body.content,
    intro: req.body.intro,
    author: req.session.user.username,
    categories: req.body.categories.split('+-+'),
    publishDate: nowtime,
    updateDate: nowtime,
    pageviews: 0
  };

  var post = new Article(articleInfo);
  post.save().then(function() {
    status.success = true;
  }).catch(function(reason) {
    status.data.err = reason;
  }).finally(function() {
    res.send(status);
  });
});

router.get('/categories/:tag', csrfProtection, function(req, res, next) {
  var queryAll = Article.find().exec();
  var queryCategories = Article.find({'categories': {$in: [req.params.tag]}}).sort({'updateDate': 'desc'}).exec();

  Promise.all([queryCategories, queryAll]).spread(function(tagArticles, allArticles) {
    var categories = [];
    allArticles.forEach(function(doc) {
      categories = categories.concat(doc.categories);
    });
    var sorted = _.filter(categories, function(tag) {
      return tag !== '';
    }).sort();

    var uniqAndStatisc = [];
    var target;
    _.map(sorted, function(tag) {
      target = _.find(uniqAndStatisc, function(o) {return o.name === tag;});
      if (target) {
        target.count++;
      } else {
        uniqAndStatisc.push({name: tag, count: 1});
      }
    });

    res.render('articles/articles', {
      articleList: tagArticles,
      csrfToken: req.csrfToken(),
      pageNum: 1,
      pageSum: 1,
      categories: uniqAndStatisc,
      pageBarSize: config.pageBarSize
    });
  }).catch(function(reason) {
    res.send(util.inspect(reason));
  });
});

module.exports = router;
