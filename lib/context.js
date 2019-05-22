/**
 * Sets up the base context object.
 */

let self;
module.exports = 
{
	markdown : require('jstransformer')(require('jstransformer-markdown-it')),
	_        : undefined,
	moment   : undefined,

	path    : undefined, //Gets the current full path from server root.
	subPath : undefined, //Gets current path relative to the current app

	construct (newVals)
	{
		let ctx = Object.create(this);
		if (newVals) 
			Object.assign(ctx, newVals);

		return ctx;
	},
};
