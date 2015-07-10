###RollGramBot

This is a Telegram Bot that can store custom dice rolls for different users and roll them on command. It can also roll unsaved rolls on the fly.

It uses node.js + mongoDB on the server side and is made possible by the [node-telegram-bot](https://github.com/depoio/node-telegram-bot) project.

If you'd like to host your own, make sure to change the value of `botToken` in `config/config.js` to your Telegram API token.



At the current stage the code is neither DRY nor elegant, but this is a learning project for me that I work on in my spare time, so please excuse the lacking aspects. 
