var config = require('./config/config'),
mongoose = require('./config/mongoose'),
Bot = require('node-telegram-bot');
var db = mongoose();

var parseRollString = function(rollStr){
	console.log(rollStr);
	if(rollStr.indexOf('d') === -1){
		return false;
	}
	var splitStr = rollStr.split('d');
	// console.log(splitStr);
	var firstPart = splitStr[0];
	var secondPart = rollStr.substring(firstPart.length + 1);

	times = parseInt(firstPart);

	if(times === NaN || times <= 0 || times > 100){
		return false;
	}
	//no more than 100 due to abuse considerations
	//firstInt is a positive integer at this point
	console.log("times: " + times);

	var dice = NaN;
	var modifier = NaN;
	if(rollStr.indexOf('+') > 0 ){
		splitStr = secondPart.split('+');
		if(splitStr.length > 2){
			return false;
		}
		dice = parseInt(splitStr[0]);
		modifier = parseInt(splitStr[1]);
	} else if (rollStr.indexOf('-') > 0 ){
		splitStr = secondPart.split('-');
		if(splitStr.length > 2){
			return false;
		}
		dice = parseInt(splitStr[0]);
		modifier = -1 * parseInt(splitStr[1]);
	} else {
		dice = parseInt(secondPart);
		modifier = 0;
	}

	if(dice === NaN || modifier === NaN){
		return false;
	}


	rollValues = {
		"times" : times,
		"dice" : dice,
		"modifier" : modifier
	};


	console.log(rollValues);

	return rollValues;

};


var calculateRoll = function(roll){
	var sum = 0;
	for (var i = 0; i < roll.times; i++) {
		sum += Math.floor(Math.random() * roll.dice) + 1;
	};
	sum += roll.modifier;
	return sum;
}

var bot = new Bot({
	token: config.token
})
.on('message', function (message) {
	console.log(message);
	var User = db.model('User');
	var Roll = db.model('Roll');

	if(message.hasOwnProperty("text"))
	{
		splitStr = message.text.split(" ");

		if(splitStr.length === 1)
		{
			if(splitStr[0] === "/register")
			{
				console.log("entered /register")
				var userRegisterCallback = function(err,user){
					// var User = db.model('User');
					if(err) 
					{
						console.log("error at /register, User.findOne");
						console.log(err);
						bot.sendMessage({"chat_id" : message.chat.id , "text" : err},function(nodifiedPromise){});
						return
					}
					if(user === null)
					{
						User.create({"id": message.from.id}, function(err){
							console.log("error at /register, User.findOne, User.create");
							console.log(err);
							bot.sendMessage({"chat_id" : message.chat.id , "text" : err},function(nodifiedPromise){});
							return
						});
						console.log('added new user');
						bot.sendMessage({"chat_id" : message.chat.id , "text" : "User " + message.from.username + " is registered"},function(nodifiedPromise){});
					} else {
						bot.sendMessage({"chat_id" : message.chat.id , "text" : "User " + message.from.username + " was already registered"},function(nodifiedPromise){});
					}
				};
				userRegisterCallback.message = message;
				User.findOne({"id": message.from.id}, userRegisterCallback);
			}
			else if (splitStr[0] === "/help")
			{
				bot.sendMessage({"chat_id" : message.chat.id , "text" : "/register - register to start using the bot and save your custom rolls | usage: \"/register\"\n/qroll - quick roll without saving a custom roll | usage: \"/qroll 1d4+1\"\n/save - save a custom roll | usage \"/save magicmissile 1d4+1\"\n/roll - roll a previously saved custom roll | usage: \"/roll magicmissile\""});
			}
			else if (splitStr[0] === "/show")
			{
				console.log("showing rolls");
				var userCallback = function(err,user)
				{
					if(err) 
					{
						console.log(err);
						bot.sendMessage({"chat_id" : message.chat.id , "text" : err.toString()},function(nodifiedPromise){});
						return
					}
					if(user === null)
					{
						bot.sendMessage({"chat_id" : message.chat.id , "text" : "Please register first by typing \"/register\" (without the quotes)"});
					} else 
					{
						console.log('found user');
					//found user, now display rolls
						var rollCallback = function(err,rolls)
						{
							if(err) 
							{
								console.log(err);
								bot.sendMessage({"chat_id" : message.chat.id , "text" : err.toString()},function(nodifiedPromise){});
								return
							}
							if(rolls === null)
							{
								bot.sendMessage({"chat_id" : message.chat.id , "reply_to_message_id" : message.message_id ,"text" : "No saved rolls found. Please save a roll first with \"/save <roll name> <integer>d<integer>{+,-}<integer>\", for example: \"/save magicmissile 1d4+1\""},function(nodifiedPromise){});
							} else 
							{
								var msgText = 'Saved rolls for ' + message.from.username + '\n';
								rolls.forEach(function(val,ind,arr){
									var modifierSign = '+';
									if(val.modifier < 0) modifierSign = '';
									msgText += val.name + " | " + val.times + "d" + val.dice +  modifierSign + val.modifier + '\n';
								});
								bot.sendMessage({"chat_id" : message.chat.id , "reply_to_message_id" : message.message_id ,"text" : msgText },function(nodifiedPromise){});
							}
							rollCallback.message = message;
							Roll.find({"id": message.from.id},rollCallback);
						}
					}
				}
				userCallback.message = message;
				User.findOne({"id": message.from.id}, userCallback);
			}

		}
		else if (splitStr.length === 2)
		{ 
			if(splitStr[0] === "/roll")
			{
				var key = splitStr[1];	
				var userCallback = function(err,user){
					if(err) 
					{
						console.log(err);
						bot.sendMessage({"chat_id" : message.chat.id , "text" : err.toString()},function(nodifiedPromise){});
						return
					}
					if(user === null)
					{
						bot.sendMessage({"chat_id" : message.chat.id , "text" : "Please register first by typing \"/register\" (without the quotes)"});
					} else 
					{
						//found user, now find roll if exists
						var rollCallback = function(err,roll){
							if(err) 
							{
								console.log(err);
								bot.sendMessage({"chat_id" : message.chat.id , "text" : err.toString()},function(nodifiedPromise){});
								return
							}
							if(roll === null)
							{
								bot.sendMessage({"chat_id" : message.chat.id , "reply_to_message_id" : message.message_id ,"text" : "Unsaved custom roll. Please save first with \"/save <roll name> <integer>d<integer>{+,-}<integer>\", for example: \"/save magicmissile 1d4+1\""},function(nodifiedPromise){});
							} else 
							{
								var newRoll = {};
								newRoll.times = roll.times;
								newRoll.dice = roll.dice;
								newRoll.modifier = roll.modifier;
								result = calculateRoll(newRoll);
								bot.sendMessage({"chat_id" : message.chat.id , "reply_to_message_id" : message.message_id ,"text" : message.from.username + " | " + key + " | " + result },function(nodifiedPromise){});
							}

						}
						rollCallback.message = message;
						rollCallback.key = key;
						Roll.findOne({"id": message.from.id , "name" : key},rollCallback);
					// 	if(user.rolls.hasOwnProperty(key))
					// 	{
					// 		roll = user.rolls[key];
					// 		result = calculateRoll(roll);
					// 		bot.sendMessage({"chat_id" : message.chat.id , "reply_to_message_id" : message.message_id ,"text" : message.from.username + " | " + key + " | " + result },function(nodifiedPromise){});
					// 	// bot.sendMessage({"chat_id" : message.chat.id ,"text" : },function(nodifiedPromise){});
						
					// } else {
					// 	bot.sendMessage({"chat_id" : message.chat.id , "reply_to_message_id" : message.message_id ,"text" : "Roll name not found. Please save this roll first by \"/save <rollName> <integer>d<integer>{+,-}<integer>\", for example: \"/save magicmissile 1d4+1\""},function(nodifiedPromise){});
					// }
				}
			};
			userCallback.message = message;
			userCallback.key = key;
			User.findOne({"id": message.from.id}, userCallback);
			} 
			else if(splitStr[0] === "/qroll")
			{
				var roll = parseRollString(splitStr[1]);
				if(roll === false){
					bot.sendMessage({"chat_id" : message.chat.id , "reply_to_message_id" : message.message_id ,"text" : "Invalid roll format or unsaved custom roll. The expected format is \"/qroll <integer>d<integer>{+,-}<integer>\", for example: \"/qroll 2d12+4\""},function(nodifiedPromise){});
					return
				}
				var result = calculateRoll(roll);
				bot.sendMessage({"chat_id" : message.chat.id , "reply_to_message_id" : message.message_id ,"text" : message.from.username + " | " + splitStr[1] + " | " + result },function(nodifiedPromise){});
			}
			// else
			// {
			// 	bot.sendMessage({"chat_id" : message.chat.id , "text" : "Unknown request. Try /help for options"});
			// }
		}
		else if (splitStr.length === 3)
		{
			if(splitStr[0] === "/save")
			{
			var key = splitStr[1];
			var roll = parseRollString(splitStr[2]);

			if(roll === false)
			{
				bot.sendMessage({"chat_id" : message.chat.id , "reply_to_message_id" : message.message_id ,"text" : "Invalid save format. The expected format is \"/save <roll name> <integer>d<integer>{+,-}<integer>\", for example: \"/save magicmissile 1d4+1\""},function(nodifiedPromise){});
				return
			}

			var saveCallback = function(err,user){
				// var User = db.model('User');
				if(err) 
				{
					console.log(err);
					bot.sendMessage({"chat_id" : message.chat.id , "text" : "Unknown error" },function(nodifiedPromise){});
					return
				}
				if(user === null)
				{
					bot.sendMessage({"chat_id" : message.chat.id , "text" : "Please register first by typing \"/register\" (without the quotes)"});
				}
				else 
				{
					if(roll === false)
					{
						bot.sendMessage({"chat_id" : message.chat.id , "reply_to_message_id" : message.message_id ,"text" : "Invalid roll format. The expected format is \"<integer>d<integer>{+,-}<integer>\", for example: \"2d12+4\""},function(nodifiedPromise){});
					} 
					else
					{	
						// user = user.toObject();
						// console.log(typeof(user.rolls));
						// console.log('user before adding roll');
						// console.log(user);
						// user.rolls[key.toString()] = roll;
						// console.log('user after adding roll');
						// console.log(user);

						// var rollArray = new Array();
						// rollArray[key] = roll;
						// console.log(rollArray);

						Roll.update({"id": user.id, "name": key}, {$set: {"dice": roll.dice, "times": roll.times, "modifier": roll.modifier}}, {"upsert": true, "new": true}, function(err,result){
							console.log(result);
							console.log('recorded roll');
							bot.sendMessage({"chat_id" : message.chat.id , "reply_to_message_id" : message.message_id ,"text" : message.from.username + " | " + key + " | saved"},function(nodifiedPromise){});							
						});
					}
				}
			};
			saveCallback.message = message;
			saveCallback.roll = roll;
			saveCallback.key = key;
			// saveCallback.rollString = splitStr[2];
			User.findOne({"id": message.from.id}, saveCallback);

			}
			// else
			// {
			// 	bot.sendMessage({"chat_id" : message.chat.id , "text" : "Unknown request. Try /help for options"});
			// }
		}
	}
}).start();