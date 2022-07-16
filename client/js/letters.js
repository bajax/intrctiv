'use strict';
const SocketIO = require('socket.io-client');
const debug    = require('debug')('ia:app:letters');
require('../../lib/get-em-pixels');

let userCnt  = 0;
let myID;
let magnets = Object.create(null);
let initialOffset;
let grabbedMag;
let moveAcc;

const mkMagnet = (magnetDef) =>
{
	let el = document.createElement('div');

	el.innerText        = magnetDef.letter;
	el.style.color      = `rgb(${magnetDef.color.map(cm=>Math.round(Math.min(cm*255, 255))).join(',')})`;
	el.style.position   = 'absolute';
	el.style.left       = magnetDef.x + 'rem';
	el.style.top        = magnetDef.y + 'rem';
	el.style['z-index'] = magnetDef.zIndex;
	el.className        = 'fridge-magnet';
	el.onmousedown      = onMouseDown;
	el.ontouchstart     = onTouchStart;

	el.setAttribute('magnet-id', magnetDef.id);

	magnets[magnetDef.id] = el;
	document.getElementById('target').appendChild(el);
};

const mvMagnet = (id, newX, newY, _moveAcc, me) =>
{
	moveAcc = _moveAcc;
	if (myID === me)
		return;

	let el              = magnets[id];
	el.style.left       = newX + 'rem';
	el.style.top        = newY + 'rem';
	el.style['z-index'] = moveAcc;
};

const userEnter = (_userCnt) =>
{
	userCnt = _userCnt;
	document.getElementById('user-count').innerText = userCnt;
	debug('user entered');
}

const userLeave = (_userCnt) =>
{
	userCnt = _userCnt;
	document.getElementById('user-count').innerText = userCnt;
	debug('user left');
}

const init = (magnets, userID, _userCnt, horizontal, _moveAcc) =>
{
	debug('init');
	document.getElementById('target').innerText = '';
	magnets.forEach(mkMagnet);
	myID    = userID || myID;
	userCnt = _userCnt;
	document.getElementById('user-count').innerText = userCnt;

	if (horizontal)
		document.getElementById('target').setAttribute('horizontal', true);

	moveAcc = _moveAcc;
};

const onTouchStart = function (e)
{
	let t = e.touches[0];
	let po = document.getElementById('target').getBoundingClientRect();
	let mo = e.target.getBoundingClientRect();

	let x = t.pageX-po.left;
	let y = t.pageY-po.top;

	return moveStart(e.target, x, y, t.pageX-mo.left, t.pageY-mo.top);
}
const onTouchMove = function (e)
{
	let t = e.touches[0];
	let po = document.getElementById('target').getBoundingClientRect();
	
	e.preventDefault();

	return move(e.target, t.pageX-po.left, t.pageY-po.top);
}
const onTouchEnd = function (e)
{
	let mo = grabbedMag.getBoundingClientRect();
	let po = document.getElementById('target').getBoundingClientRect();
	
	return moveEnd(this, mo.left-po.left, mo.top-po.top);
}
const onMouseDown = function (e)
{
	return moveStart(this, e.clientX, e.clientY, e.offsetX, e.offsetY);
}
const onMouseMove = function (e)
{
	if (!e.buttons)
		return onMouseUp.call(this, e);

	return move(this, e.offsetX, e.offsetY);
}
const onMouseUp = function (e)
{
	return moveEnd(this, e.offsetX, e.offsetY);
}

const moveStart = function (el, x, y, offsetX, offsetY) 
{
	debug('md');
	if (grabbedMag)
		throw Error('Already dragging a magnet!');

	let id = el.getAttribute('magnet-id');
	debug(`started dragging ${id}`);

	grabbedMag                         = el;
	grabbedMag.style.transition        = 'none';
	grabbedMag.style['z-index']        = moveAcc+1;
	
	let mags = document.getElementsByClassName('fridge-magnet')
	for(let i = 0; i < mags.length; i++)
		mags[i].style['pointer-events'] = 'none';

	initialOffset = [offsetX, offsetY];

	let target = document.getElementById('target');

	target.onmousemove   = onMouseMove;
	target.onmouseup     = onMouseUp;
	target.onmouseleave  = onMouseUp;
	target.ontouchmove   = onTouchMove;
	target.ontouchend    = onTouchEnd;
	target.ontouchcancel = onTouchEnd;
};

const move = function (el, x, y)
{
	debug('mm');
	
	let px = getEmPixels();
	
	grabbedMag.style.left = ((x-initialOffset[0])/px) + 'rem';
	grabbedMag.style.top  = ((y-initialOffset[1])/px) + 'rem';
};

const moveEnd = function (el, x, y)
{
	debug('mu');
	let id = grabbedMag.getAttribute('magnet-id');

	debug(`stopped dragging ${id}`);
	grabbedMag.style.transition = null;
	grabbedMag = undefined;

	let mags = document.getElementsByClassName('fridge-magnet')
	for(let i = 0; i < mags.length; i++)
		mags[i].style['pointer-events'] = null;

	let target = document.getElementById('target');

	target.onmousemove   = undefined;
	target.onmouseup     = undefined;
	target.onmouseleave  = undefined;
	target.ontouchmove   = undefined;
	target.ontouchend    = undefined;
	target.ontouchcancel = undefined;

	let px = getEmPixels();
	socket.emit('move', id, (x-initialOffset[0])/px, (y-initialOffset[1])/px, myID);
};

const connect = () =>
{
	debug('c');
	socket.on('init', init);
	socket.on('move', mvMagnet);
	socket.on('user-enter', userEnter);
	socket.on('user-leave', userLeave);

	//bind dragndrop events
};

let socket = SocketIO('/letters');
socket.on('connect', connect);

global.socket = socket;

const applyNarrowIfNarrowerThan = (aspect) => function (e)
{
	if (window.innerWidth / window.innerHeight < aspect)
	{
		document.body.className = 'narrow';
		document.documentElement.className = 'narrow';
	}
	else
	{
		document.body.className = null;
		document.documentElement.className = null;
	}
};

window.onresize = window.onload = applyNarrowIfNarrowerThan(3/4);
