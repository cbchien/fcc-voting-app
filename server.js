// create db connection
var db = 'mongodb://localhost:27017/free-code-camp-voting';

var port = process.env.PORT || 8000;

//router
var router = require('./routes/api')

// load npm

var express = require('express');
var morgan = require('morgan');
var mongoose = require('mongoose');
var bodyParser = require('body-Parser');
var dotenv = require('dotenv');
var app = express();

// load in environment variables
dotenv.config({ verbose: true});

//connect to mongo

mongoose.connect(db, function(err){
	if(err){console.log(err)}
}); 

//listen to mongoose connection
mongoose.connection.on('connected', function(){
	console.log('Successfully opend a connection to ' + db)
})

mongoose.connection.on('disconnected', function(){
	console.log('Successfully disconected to ' + db)
})

mongoose.connection.on('error', function(){
	console.log('Error connecting to ' + db)
}) 

//application setting
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false}));
app.use(express.static(__dirname + '/public'));
app.use('/node_modules', express.static(__dirname + '/node_modules'));
app.use('/api', router);
app.get("*", function(req, res){
	res.sendFile(__dirname + '/public/index.html');
})

//Start server
app.listen(port, function(){
	console.log('listening on ' + port)
})

console.log(process.env.secret);