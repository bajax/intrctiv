'use strict';
const debug = require('debug')('ia:app:letters');

const SYMBOLS = [
                 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L',
                 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X',
                 'Y', 'Z', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 
                 '!', '?', '.'
                 ];

const SETS               = 3;
const SCRABBLE_DIST      = false;
const HORIZONTAL         = true;
const GUTTER             = .5;
const MARGIN             = .5;
const CWIDTH             = 30;
const CHEIGHT            = 40;
const PER_RANK           = Math.ceil(SYMBOLS.length/5 * SETS);
const WIDTH              = (CWIDTH - MARGIN * 2 - (PER_RANK - 1) * GUTTER)/PER_RANK;
const HEIGHT             = 2;
const MAXX               = CWIDTH-WIDTH;
const MAXY               = CHEIGHT-HEIGHT;
const COLOR_CYCLE_FACTOR = .5;
const MIN_INTENSITY      = .4;

const COUNTS =
{
	A   :  9,
	B   :  2,
	C   :  2,
	D   :  4,
	E   : 12,
	F   :  2,
	G   :  2,
	H   :  2,
	I   :  9,
	J   :  1,
	K   :  1,
	L   :  4,
	M   :  2,
	N   :  6,
	O   :  8,
	P   :  2,
	Q   :  1,
	R   :  6,
	S   :  4,
	T   :  6,
	U   :  4,
	V   :  2,
	W   :  2,
	X   :  1,
	Y   :  2,
	Z   :  2,
	1   :  1,
	2   :  1,
	3   :  1,
	4   :  1,
	5   :  1,
	6   :  1,
	7   :  1,
	8   :  1,
	9   :  1,
	0   :  1,
	'?' :  1,
	'.' :  1,
	'!' :  1,
	'!' :  1,
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
	let moveAcc   = 0;
	let userCnt   = 0;
	let maxUserID = 0;

	for (let i = 0; i < SYMBOLS.length * SETS; i++)
	{
		let idx = i % SYMBOLS.length;

		let letterLBL = SYMBOLS[idx];

		let destCnt = SCRABBLE_DIST ? COUNTS[letter] : 1;
		for (let cnt = 0; cnt < destCnt; cnt++)
		{
			let rank = Math.floor(accum/PER_RANK);
			let file = (accum%PER_RANK);

			debug(letterLBL, rank, file);

			let magnet    = Object.create(MAGNETPROTO);
			magnet.letter = letterLBL;
			let colorIDX;

			colorIDX = accum / (destCnt * SETS) * Math.PI * 2 * COLOR_CYCLE_FACTOR;

			magnet.color  =
			[
				Math.sin(colorIDX * COLOR_CYCLE_FACTOR               ) + MIN_INTENSITY,
				Math.sin(colorIDX * COLOR_CYCLE_FACTOR + Math.PI/3*2 ) + MIN_INTENSITY,
				Math.sin(colorIDX * COLOR_CYCLE_FACTOR + Math.PI/3*4 ) + MIN_INTENSITY
			];

			magnet.id     = ++accum;
			magnet.zIndex = magnet.id;

			if (HORIZONTAL)
			{
				magnet.x = Math.max(MARGIN, MARGIN + Math.min((file * WIDTH)  + GUTTER * file, MAXX - MARGIN));
				magnet.y = CHEIGHT - HEIGHT - Math.max(MARGIN, MARGIN + Math.min((rank * HEIGHT) + GUTTER * rank, MAXY - MARGIN));
			}
			/*else
			{
				magnet.x = Math.max(MARGIN, MARGIN + Math.min((cnt * WIDTH) + GUTTER*cnt/2, MAXX-MARGIN));
				magnet.y = Math.max(MARGIN, MARGIN + Math.min((rank * HEIGHT) + GUTTER*rank, MAXY-MARGIN));
			}*/

			magnets.push(magnet);
		}
	}

	moveAcc = accum;

	debug('done setting up letters, total', accum);

	socket.on('connect', skt =>
	{
		debug('user connected');
		userCnt++;
		//no need to keep track of individual presences (I think)
		skt.emit('init', magnets, maxUserID++, userCnt, false, moveAcc);

		socket.emit('user-enter', userCnt);

		skt.on('move', (id, newX, newY, me) =>
		{
			debug(`user ${me} moved ${id} to ${newX}, ${newY}`);

			newX = Math.max(MARGIN, Math.min(newX, MAXX));
			newY = Math.max(MARGIN, Math.min(newY, MAXY));
			let magnet = magnets[id-1];
			magnet.x = newX;
			magnet.y = newY;
			magnet.zIndex = moveAcc++;

			socket.emit('move', id, newX, newY, moveAcc, me);

			if (moveAcc > 10000)
			{
				chopZIndices(magnets);
				moveAcc = magnets.length;
				socket.emit('init', magnets, undefined, userCnt, false, moveAcc);
			}
		});

		skt.on('disconnect', () =>
		{
			debug('user disconnected');
			userCnt--;
			socket.emit('user-leave', userCnt);
		});

		skt.on('chop[', () =>
		{
			magnets = reSortZIndex(magnets, moveAcc);
			moveAcc = magnets.length;
			socket.emit('init', magnets, undefined, userCnt, false, moveAcc);

		});
	});

	return (req, res, next) =>
	{
		req.ctx.title = 'The fridge!'
		res.render('letters', req.ctx);

	};
};

const chopZIndices = function (magnets)
{
	magnets.forEach((m, i) =>
	{
		m.zIndex -= moveAcc;
	});

	return magnets;
};
