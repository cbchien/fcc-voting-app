//code orginal from Theodore Anderson @andersontr15

var express = require('express');
var router = express.Router({ caseSensitive: true });
var bcrypt = require('bcrypt-nodejs');
var jwt = require('jsonwebtoken')
var User = require('../models/user');
var Poll = require('../models/polls');

//get all polls

router.get('/polls', function(req, res) {
    Poll.find({}, function(err, polls) {
        if (err) {
            return res.status(404).send(err)
        } else {
            return res.status(200).send(polls)
        }
    })
});

//create new poll

router.post('/polls', authentication, function(req, res){
	console.log(req.body);
	if(!req.body.options || !req.body.name) {
		return res.status(400).send('No poll data supplied');
	}
	var poll = new Poll();
	poll.name = req.body.name;
	poll.options = req.body.options;
	poll.user = req.body.id;

	poll.save(function(err, document) {
        if (err) {
            if (err.code === 11000) {
                return res.status(400).send('No dupes!');
            }
            return res.status(400).send(err)
        } else {
            return res.status(201).send({
                message: 'Successfully created a poll',
                data: document
            })
        }
    })

})

//token verification

router.post('/verify', function(req, res){
	if(!req.body.token) {
		return res.status(400).send('No token has been provided')
	} 
	jwt.verify(req.body.token, process.env.secret, function(err, decoded){
		if(err){
			return res.status(400).send('Error with token')
		}
		return res.status(200).send(decoded)
	})
})

//Login

router.post('/login', function(req, res){
	if(req.body.name && req.body.password) {
		User.findOne({ name: req.body.name}, function(err, user){
			if(err){
				return res.status(400).send('An error occured. Try Again');
			} else if (!user) {
				return res.status(404).send('Your account has not been registered');
			} else if (bcrypt.compareSync(req.body.password, user.password)){
				console.log('password matched')
				var token = jwt.sign({
					data: user
				}, process.env.secret, {expiresIn: 3600})
				return res.status(200).send(token);
			} else {
				return res.status(400).send('Password incorrect');
			}
		});
	} else {
		return res.status.send('Please enter valid username and password');
	}
});

//Register

router.post('/register', function(req, res){
	if(req.body.name && req.body.password){
		var user = new User();
		user.name = req.body.name;
		console.time('bcryptHashing');
		user.password = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(15))
		console.timeEnd('bcryptHashing');
		user.save(function(err, doc) {
			if(err){
				return res.status(400).send(err)
			} else {
				var token = jwt.sign({
					data: doc
				}, process.env.secret, {expiresIn: 3600})
				return res.status(201).send(token)
			}
		})
	} else {
		return res.status(400).send({
			message: 'Invalid username/password'
		})
	}
});

//authentication middleware

function authentication(req, res, next){
	console.log('in authentication');
	console.log(req.headers);
	if(!req.headers.authorization) {
		return res.status(400).send('No token supplied')
	} else if (req.headers.authorization.split(' ')[1]){
		var token = req.headers.authorization.split(' ')[1]
		jwt.verify(token, process.env.secret, function(err, decoded){
			if(err){
				console.log('error with toke');
				return res.status(400).send(err)
			}
			console.log('continuing with middleware')
			next()
		})
	}
}


module.exports = router;