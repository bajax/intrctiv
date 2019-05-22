/**
 * Builds an express app with Browserify, Sass, Static, Pug, and Context (configurable).
 * So I don't have to have copypasted code all over.
 */
'use strict';
const path               = require('path');
const Express            = require('express');
const Debug              = require('debug');
const Browserify         = require('browserify-middleware');
const SassMiddleware     = require('node-sass-middleware');
const SassModuleImporter = require('sass-module-importer');

module.exports = ({name, service, ctx, js, pug, sass, stat}) =>
{
	let app = Express();
	app.set('strict routing', true);
	app.disable('x-powered-by');
	const debug = Debug('ia:lib:common-app:'+name);

	if (stat)
	{
		debug('enabling static files from', stat);
		app.use('/static', Express.static(stat, {redirect: false}));
	}

	if (js)
	{
		debug('enabling Browserify with sources at', js);
		app.use('/js', Browserify(js, 
		{
			transform:
			[
				['babelify', {presets: ['es2015',]} ],
				['pugify', {pretty : false } ],
			],
		}));
	}

	if (sass)
	{
		debug('enabling SASS with sources at', sass);
		app.use('/css', SassMiddleware(
		{
			src            : sass,
			indentedSyntax : true,
			sourceMap      : false,
			response       : true,
			importer       : SassModuleImporter(),
		}));
	}

	if (pug)
	{
		debug('enabling pug templates from', pug);
		app.set('view engine', 'pug');
		app.set('views', pug);
		if (name === 'root')
			app.locals.basedir = path.join(pug);
	}

	if (ctx || service)
	{
		debug('enabling CTX restructuring');
		app.use((req, res, next) =>
		{
			if (service)
				req.service = service;

			if (req.ctx && ctx)
				req.ctx = req.ctx.construct(ctx);
			else if (ctx)
				req.ctx = ctx.construct();

			next();
		});
	}

	/**
	 * This middleware sets CTX path info. Used for e.g. nav highlighting.
	 */
	app.use((req, res, next) =>
	{
		req.ctx.subPath = req.path;
		if (name === 'root')
			req.ctx.path = req.path;

		next();
	});

	return app;

}
