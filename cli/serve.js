const pJoin  = require('path').join;
const config = require('nconf')
	.argv()
	.env()
	.file('conf', pJoin(__dirname, '../config.json'))
	.file('env', pJoin(__dirname, `../config.${process.NODE_ENV||'development'}.json`))
	.get();

const express  = require('express');
const app      = express();
if (!config.listen)
	throw Error('no listen directive.  Is your conf good?');
const server   = app.listen(config.listen);
const Interact = require('../app');
const debug    = require('debug')('intrctiv:serve');

let interctv = Interact(server);
app.use(interctv);

server.on('listening', () => 
{
	console.log('now listening on ' + config.listen);
});
