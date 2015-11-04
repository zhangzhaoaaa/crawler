/**
 * Created by mike on 15-11-4.
 */
var mongoose = require( 'mongoose' );
var Schema   = mongoose.Schema;

var Blog_TotalVisited = new Schema({
    user_id    : String,
    user_name  : String,
    totalCount : Number,
    created_date : Date
});
var Blog_records = new Schema({
    user_id      : String,
    blog_id      : String,
    blog_title   : String,
    browserCount : Number,
    dateTime     : String,
    diffCount    : Number,
    created_date : Date
},{ _id: false });

mongoose.model( 'Blog_TotalVisited', Blog_TotalVisited );
mongoose.model( 'Blog_records', Blog_records );
mongoose.connect( 'mongodb://localhost/blogcrawler' );