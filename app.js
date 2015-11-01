var express = require('express');
var cheerio = require('cheerio');
var superagent = require('superagent');
var http = require('http');
var app = express();

app.use('/', function (req, res, next) {
  superagent.get('http://zhangzhaoaaa.iteye.com')
      .end(function (err, sres) {
        if (err) {
          return next(err);
        }
        var $ = cheerio.load(sres.text);
        var items = [];
        var totalPages = $('.pagination a').eq(3).text();
        $('.blog_main').each(function(idx,element){
          var $element = $(element);
          items.push({
            title:$element.find('.blog_title a').text(),
            dateTime:$element.find('.blog_bottom .date').text(),
            browserCount:parseInt(($element.find('.blog_bottom .date').next().text()).match(/[\d]+/)[0])
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
                    items.push({
                      title:$element.find('.blog_title a').text(),
                      dateTime:$element.find('.blog_bottom .date').text(),
                      browserCount:parseInt(($element.find('.blog_bottom .date').next().text()).match(/[\d]+/)[0])
                    });
                  });
                });

           /* var opt = {
              host:'182.88.129.220',
              port:'8123',
              method:'POST',//这里是发送的方法
              path:'http://zhangzhaoaaa.iteye.com?page='+i,     //这里是访问的路径
              headers:{
                //这里放期望发送出去的请求头
              }
            }
//以下是接受数据的代码
            var req = http.request(opt, function(res) {
              console.log("Got response: " + res.statusCode);
              res.on('data',function(sres){
                var $ = cheerio.load(sres.responseText);
                $('.blog_main').each(function(idx,element){
                  var $element = $(element);
                  items.push({
                    title:$element.find('.blog_title a').text(),
                    dateTime:$element.find('.blog_bottom .date').text(),
                    browserCount:$element.find('.blog_bottom .date').next().text()
                  });
                });
              }).on('end', function(){
                console.log(res.headers)
                console.log(body)
              });

            }).on('error', function(e) {
              console.log("Got error: " + e.message);
            })
            req.end();*/
          }
        }
        var one = Math.floor(parseInt(totalPages)/3);
        var two = one*2;
        for (var i=2;i<=one;i++){
          setTimeout(callReq(i),2000);
        }
        for (var i=one+1;i<=two;i++){
          setTimeout(callReq(i),3000);
        }
       for (var i=two+1;i<=parseInt(totalPages);i++){
          setTimeout(callReq(i),2000);
        }
        setTimeout(function(){
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
          res.send(retArr);
        },60000);
      });
});

app.listen(3000,function(){
  console.log("starting...");
});

