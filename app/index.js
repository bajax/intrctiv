'use strict';
const CommonApp = require('../lib/common-app');
const Express   = require('express');
const Context   = require('../lib/context');
const pJoin     = require('path').join;
const SocketIO   = require('socket.io');

module.exports = (server, config) =>
{
	let ctx = Object.create(Context);
	let app;

	if (config.env !== 'production')
		app = CommonApp(
		{
			name    : 'root',
			pug     : pJoin(__dirname, '../client/templates'),
			sass    : pJoin(__dirname, '../client/sass'),
			js      : pJoin(__dirname, '../client/js'),
			stat    : pJoin(__dirname, '../client/static'),
			ctx     : ctx,
		});
	else
		app = Express();

	let io = SocketIO(server);

	if (config.env === 'development')
		app.use(require('morgan')('dev'));
	
	let apps = [];

	apps.push(['/letters', require('./letters')(io.of('/letters'))]);
	//apps.push(['/blockart', require('./blockart')(io.of('/blockart'))]);
	//apps.push(['/scratchy', require('./scratchy')(io.of('/scratchy'))]);

	if (config.env !== 'production')
	{
		apps.forEach((params)=>app.get(...params));

		app.get('/', (req, res, next) =>
		{
			req.ctx.title = 'Stuff.';
			res.render('index', req.ctx);
		});
	}

	return app;
};
