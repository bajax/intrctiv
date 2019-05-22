'use strict';
const debug = require('debug')('ia:app:letters');

const SETS               = 8;
const SCRABBLE_DIST      = false;
const HORIZONTAL         = true;
const WIDTH              = 4;
const HEIGHT             = 4;
const GUTTER             = .5;
const MARGIN             = 1;
const MAXX               = 160-WIDTH;
const MAXY               = 90-HEIGHT;
const COLOR_CYCLE_FACTOR = .9;
const MIN_INTENSITY      = .4;

const LETTERS =
{
	A : {count : 9},
	B : {count : 2},
	C : {count : 2},
	D : {count : 4},
	E : {count : 12},
	F : {count : 2},
	G : {count : 2},
	H : {count : 2},
	I : {count : 9},
	J : {count : 1},
	K : {count : 1},
	L : {count : 4},
	M : {count : 2},
	N : {count : 6},
	O : {count : 8},
	P : {count : 2},
	Q : {count : 1},
	R : {count : 6},
	S : {count : 4},
	T : {count : 6},
	U : {count : 4},
	V : {count : 2},
	W : {count : 2},
	X : {count : 1},
	Y : {count : 2},
	Z : {count : 1},
};

const MAGNETPROTO =
{
	id     : undefined,
	letter : undefined,
	x      : 0,
	y      : 0,
	color  : [   0.00,   0.00,   0.00],
};

module.exports = (socket) =>
{
	let magnets   = [];
	let accum     = 0;
	let rank      = 0;
	let userCnt   = 0;
	let maxUserID = 0;

	for (let letterLBL in LETTERS)
	{
		let letter       = LETTERS[letterLBL];
		letter.letter    = letterLBL;

		let destCnt = SCRABBLE_DIST ? letter.count : 1;
		for (let cnt = 0; cnt < destCnt * SETS; cnt++)
		{
			let magnet    = Object.create(MAGNETPROTO);
			magnet.letter = letterLBL;
			let colorIDX;

			if (SCRABBLE_DIST)
				colorIDX = Object.keys(LETTERS).indexOf(letterLBL) * COLOR_CYCLE_FACTOR;
			else
				colorIDX = cnt / (destCnt * SETS) * Math.PI * 2 * COLOR_CYCLE_FACTOR;

			magnet.color  =
			[
				Math.sin(colorIDX * COLOR_CYCLE_FACTOR              ) + MIN_INTENSITY,
				Math.sin(colorIDX * COLOR_CYCLE_FACTOR + Math.PI/3*2) + MIN_INTENSITY,
				Math.sin(colorIDX * COLOR_CYCLE_FACTOR + Math.PI/3*4) + MIN_INTENSITY
			];

			magnet.id = ++accum;

			if (HORIZONTAL)
			{
				magnet.x = Math.max(MARGIN, MARGIN + Math.min((rank * WIDTH) + GUTTER*rank, MAXX-MARGIN));
				magnet.y = Math.max(MARGIN, MARGIN + Math.min((cnt * HEIGHT) + GUTTER*cnt, MAXY-MARGIN));
			}
			else
			{
				magnet.x = Math.max(MARGIN, MARGIN + Math.min((cnt * WIDTH) + GUTTER*cnt, MAXX-MARGIN));
				magnet.y = Math.max(MARGIN, MARGIN + Math.min((rank * HEIGHT) + GUTTER*rank, MAXY-MARGIN));
			}

			magnets.push(magnet);
		}
		rank++;
	}
	debug('done setting up letters, total', accum);

	socket.on('connect', skt =>
	{
		debug('user connected');
		userCnt++;
		//no need to keep track of individual presences (I think)
		skt.emit('init', magnets, maxUserID++, userCnt, HORIZONTAL);

		socket.emit('user-enter', userCnt);

		skt.on('move', (id, newX, newY, me) =>
		{
			debug(`user ${me} moved ${id} to ${newX}, ${newY}`);

			newX = Math.max(MARGIN, Math.min(newX, MAXX));
			newY = Math.max(MARGIN, Math.min(newY, MAXY));
			let magnet = magnets[id-1];
			magnet.x = newX;
			magnet.y = newY;

			socket.emit('move', id, newX, newY, me);
		});

		skt.on('disconnect', () =>
		{
			debug('user disconnected');
			userCnt--;
			socket.emit('user-leave', userCnt);
		});
	});

	return (req, res, next) =>
	{
		req.ctx.title = 'The fridge!'
		res.render('letters', req.ctx);
	};
};

