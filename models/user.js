var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = new Schema({
	name: {
		type: String,
		required: true,
		unique: true
	},
	password: {
		type: String,
		required: true
	}
});

// UserSchema.pre('save', function(next){
// 	console.log('Saving user...')
//  	var err = new Error('something went wrong');
//   	next(err);		
// 	// next();
// });
// UserSchema.post('save', function(next){
// 	console.log('User information saved.')
// 	var err = new Error('something went wrong');
//   	next(err);
// });

var Model = mongoose.model('User', UserSchema);

module.exports = Model;
