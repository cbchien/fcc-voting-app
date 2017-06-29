//code orginal from Theodore Anderson @andersontr15

var express = require('express');
var router = express.Router({ caseSensitive: true });
var bcrypt = require('bcrypt-nodejs');
var jwt = require('jsonwebtoken')
var User = require('../models/user');
var Poll = require('../models/polls');

//delete poll
router.delete('/polls/:id', function(request, response) {
    Poll.findById(request.params.id, function(err, poll) {
        if (err) {
            return response.status(400).send({
                message: 'No poll with specified id'
            })
        }
        if (poll) {
            var token = request.headers.authorization.split(' ')[1];
            jwt.verify(token, 'fcc', function(err, decoded) {
                if (err) {
                    return response.status(401).json('Unauthorized request: invalid token')
                } else {
                    console.log(poll)
                    if (decoded.data.name === poll.owner) {
                        poll.remove(function(err) {
                            if (err) {
                                return response.status(400).send(err)
                            } else {
                                return response.status(200).send({
                                    message: 'Deleted poll'
                                })
                            }
                        })
                    } else {
                        return response.status(403).send({
                            message: 'Can only delete own polls'
                        })
                    }
                }
            })
        }
    });
});


//retrieve poll
router.get('/poll/:id', function(req, res) {
    Poll.findOne({ _id: req.params.id }, function(err, poll) {
        if (err) {
            return res.status(400).send(err)
        } else {
            return res.status(200).send(poll)
        }
    })
})

//find poll to mathc user
router.get('/user-polls/:name', function(req, res) {
    if (!req.params.name) {
        return res.status(400).send({
            message: 'No user name supplied'
        })
    } else {
        Poll.find({ owner: req.params.name }, function(err, documents) {
            if (err) {
                return res.status(400).send(err)
            } else {
                return res.status(200).send(documents)
            }
        })
    }
})


//add options to existing poll
router.put('/polls/add-option', function(req, res) {
    var id = req.body.id;
    var option = req.body.option;
    Poll.findById(id, function(err, poll) {
        if (err) {
            return res.status(400).send(err)
        }
        for (var i = 0; i < poll.options.length; i++) {
            if (poll.options[i].name === option) {
                return res.status(403).send({
                    message: 'Option already exists!'
                })
            }
        }
        poll.options.push({
            name: option,
            votes: 0
        });
        poll.save(function(err) {
        	console.log(res + 'pollsave');
            if (err) {
                return res.status(400).send('Problem has occurred in saving poll!');
            } else {
                return res.status(201).send('Successfully created a poll option!');
            }
        })
    })
});



//put polls
router.put('/polls/', function(req, res) {
    console.log(typeof req.body.vote);
    Poll.findById(req.body.id, function(err, poll) {
        if (err) {
            return res.status(400).send(err)
        }
        console.log(poll)
        for (var i = 0; i < poll.options.length; i++) {
            if (poll.options[i]._id.toString() === req.body.vote) {
                console.log('hit');
                poll.options[i].votes += 1;
                poll.save(function(err) {
                    if (err) {
                        return res.status(400).send(err)
                    } else {
                        return res.status(200).send({
                            message: 'Successfully updated poll!'
                        })
                    }
                })
            }
        }
    })
});


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

router.post('/polls', authentication, function(request, response) {
    var poll = new Poll();
    poll.name = request.body.name;
    poll.options = request.body.options;
    poll.owner = request.body.owner;
    poll.save(function(err, document) {
        if (err) {
            if (err.code === 11000) {
                return response.status(400).send('No dupes!');
            }
            return response.status(400).send(err)
        } else {
            return response.status(201).send({
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
				console.log('error with token authentication');
				return res.status(400).send(err)
			}
			console.log('continuing with middleware')
			next()
		})
	}
}


module.exports = router;