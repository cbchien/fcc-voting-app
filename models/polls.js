var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PollsSchema = new Schema({
	user: {
		type: mongoose.SchemaTypes.ObjectId,
		ref: 'User'
	},
	name: {
		type: String,
		required: true,
		unique: true
	},
	options: [{
		name: {
			type: String,
			required: true,
			unique: true
		},
		votes: {
			type: Number,
			default: 0
		}
	}]
})

var Model = mongoose.model('Polls', PollsSchema);
module.exports = Model;