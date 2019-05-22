'use strict';
const CommonApp = require('../lib/common-app');
const Context   = require('../lib/context');
const pJoin     = require('path').join;
const SocketIO   = require('socket.io');

module.exports = (server) =>
{
	let ctx = Object.create(Context);

	let app = CommonApp(
	{
		name    : 'root',
		pug     : pJoin(__dirname, '../client/templates'),
		sass    : pJoin(__dirname, '../client/sass'),
		js      : pJoin(__dirname, '../client/js'),
		stat    : pJoin(__dirname, '../client/static'),
		ctx     : ctx,
	});

	let io = SocketIO(server);
	app.use(require('morgan')('dev'));
	


	app.get('/letters', require('./letters')(io.of('/letters')))

	app.get('/', (req, res, next) =>
	{
		req.ctx.title = 'Stuff.';
		res.render('index', req.ctx);
	});

	return app;
};