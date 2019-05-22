const express = require('express');
const app     = express();
const server  = app.listen(9900);
const Interact = require('../app');

let interctv = Interact(server);
app.use(interctv);

server.on('listening', () => 
{
	console.log('now listening on port 9900');
});
