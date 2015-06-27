var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

var RollSchema = new Schema({
	id: Number,
	name: String,
	dice: Number,
	times: Number,
	modifier: Number
});

var UserSchema = new Schema({
	id: Number,
	rolls:[RollSchema]
});



mongoose.model('User', UserSchema);
mongoose.model('Roll', RollSchema);