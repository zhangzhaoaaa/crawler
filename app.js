var express = require('express');
var cheerio = require('cheerio');
var superagent = require('superagent');
var http = require('http');
var path           = require( 'path' );
var static         = require( 'serve-static' );
var app = express();
require( './db' );


app.engine( 'html', require('ejs').renderFile);
app.set( 'views', path.join( __dirname, 'views' ));
app.set( 'view engine', 'html' );
app.use( static( path.join( __dirname, 'public' )));
var mongoose    = require( 'mongoose' );
var Blog_records = mongoose.model('Blog_records');
app.use('/index',function(req, res, next){
    res.render( 'index', {
        title : '爬虫抓取者123xxx'
    });
});
app.get('/',function(req,res){
    return res.redirect('/index');
});

app.use('/getData/', function (req, res, next) {
    /*http.get("http://zhangzhaoaaa.iteye.com", function(response) {
        var str = "";
        response.on('data', function (chunk) {
            str += chunk;
        });
        response.on('end', function () {
            console.log(str);
            res.send(str);
        });
    }).on('error', function(e) {
        console.log("Got error: " + e.message);
    });*/
  superagent.get('http://zhangzhaoaaa.iteye.com')
      .end(function (err, sres) {
        if (err) {
          return next(err);
        }
        var $ = cheerio.load(sres.text);
        var items = [];
        var totalCount = parseInt(($('#blog_actions ul li').eq(0).text()).match(/[\d]+/)[0]);
        var totalPages = $('.pagination a').eq(3).text();
        $('.blog_main').each(function(idx,element){
          var $element = $(element);
            var elementA = $element.find('.blog_title h3 a');
            var elementDate = $element.find('.blog_bottom .date');
          items.push({
              blog_id: (elementA.attr('href')).match(/[\d]+/)[0],
            title:elementA.text(),
            dateTime:elementDate.text(),
            browserCount:parseInt((elementDate.next().text()).match(/[\d]+/)[0])
          });
        });
       function callReq(i){
          return function(){
            superagent.get('http://zhangzhaoaaa.iteye.com?page='+i,
                function (err, sres) {
                  if (err) {
                    return next(err);
                  }
                  var $ = cheerio.load(sres.text);
                  $('.blog_main').each(function(idx,element){
                    var $element = $(element);
                      var elementA = $element.find('.blog_title h3 a');
                      var elementDate = $element.find('.blog_bottom .date');
                    items.push({
                        blog_id: (elementA.attr('href')).match(/[\d]+/)[0],
                      title:elementA.text(),
                      dateTime:elementDate.text(),
                      browserCount:parseInt((elementDate.next().text()).match(/[\d]+/)[0])
                    });
                  });
                });
          }
        }
        var one = Math.floor(parseInt(totalPages)/3);
        var two = one*2;
        for (var i=2;i<=one;i++){
          setTimeout(callReq(i),2000);//120.198.236.10
        }
        for (var i=one+1;i<=two;i++){
          setTimeout(callReq(i),3000);//222.88.236.234
        }
       for (var i=two+1;i<=parseInt(totalPages);i++){
          setTimeout(callReq(i),2000);//117.136.234.51
        }
        var insertTimeout = setTimeout(function(){
            var recodes = [];
            var storedRecords={};
            var updateRecords=[];
            var insertRecords=[];
            items.forEach(function(cur,index,arr){
                recodes.push(
                    {
                        diffCount    :0,
                        blog_id      :cur.blog_id,
                        blog_title   : cur.title,
                        browserCount : cur.browserCount,
                        dateTime     : cur.dateTime,
                        created_date : new Date()
                    });
            });
            function onInsert(err, docs) {
                if (err) {
                    next(err);
                } else {
                    console.info('%d potatoes were successfully stored.', docs.length);
                }
            }
            function onUpdate(err, docs) {
                if (err) {
                    next(err);
                } else {
                    console.info('%d potatoes were successfully updated.', docs.length);
                }
            }
            Blog_records.find(function(err,blogRecords,count){
                blogRecords.forEach(function(current,index,arr){
                    storedRecords[current["blog_id"]]=current;
                });
                recodes.forEach(function(cur,index,arr){
                    if (storedRecords[cur.blog_id]){
                        cur.diffCount = cur.browserCount-storedRecords[cur.blog_id]["browserCount"];
                        cur.created_date = new Date();
                        updateRecords.push(cur);
                    }else{
                        insertRecords.push(cur);
                    }
                });
                if (insertRecords.length>0){
                    Blog_records.collection.insert(insertRecords,onInsert);
                }
                updateRecords.forEach(function(cur,index,arr){
                    Blog_records.update({blog_id:cur.blog_id}, {$set:{diffCount:cur.diffCount,browserCount:cur.browserCount,created_date:cur.created_date}}, onUpdate);
                });
                console.log(updateRecords.length);
                console.log(insertRecords.length);
            });

            items.sort(function(a,b){
                if (a.browserCount>b.browserCount){
                    return 1;
                }else if (a.browserCount<b.browserCount){
                    return -1;
                }else{
                    return 0;
                }
            });
            items.reverse().slice(0,10).forEach(function(cur,index,arr){
                console.log(cur.title,cur.browserCount);
            });
            var retArr = items.slice(0,10);
            var labels = retArr.map(function(cur,index,arr){
                return cur.title;
            });
            var data = retArr.map(function(cur,index,arr){
                return cur.browserCount;
            });
            var query = Blog_records.find();
            query.limit(10).sort({diffCount:-1}).exec(function(err,records){
                console.log(records);
                console.log(records[0].blog_title);
                res.render( 'chart', {
                    title : '爬虫抓取者',
                    labels:labels,
                    data:data,
                    totalCount:totalCount,
                    diffTopTen:records
                });
            });
        },60000);
      });
});

app.listen(3000,function(){
  console.log("starting...");
});

