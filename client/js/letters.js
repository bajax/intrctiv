'use strict';
const SocketIO = require('socket.io-client');
const debug    = require('debug')('ia:app:letters');
require('../../lib/get-em-pixels');

let userCnt  = 0;
let myID;
let magnets = Object.create(null);
let initialOffset;
let grabbedMag;

const mkMagnet = (magnetDef) =>
{
	let el = document.createElement('div');

	el.innerText      = magnetDef.letter;
	el.style.color    = `rgb(${magnetDef.color.map(cm=>Math.round(Math.min(cm*255, 255))).join(',')})`;
	el.style.position = 'absolute';
	el.style.left     = magnetDef.x + 'rem';
	el.style.top      = magnetDef.y + 'rem';
	el.className      = 'fridge-magnet';
	el.onmousedown    = onMouseDown;

	el.setAttribute('magnet-id', magnetDef.id);

	magnets[magnetDef.id] = el;
	document.getElementById('target').appendChild(el);
};

const mvMagnet = (id, newX, newY) =>
{
	let el        = magnets[id];
	el.style.left = newX + 'rem';
	el.style.top  = newY + 'rem';
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

const init = (magnets, userID, _userCnt, horizontal) =>
{
	document.getElementById('target').innerText = '';
	magnets.forEach(mkMagnet);
	myID    = userID;
	userCnt = _userCnt;
	document.getElementById('user-count').innerText = userCnt;

	if (horizontal)
		document.getElementById('target').setAttribute('horizontal', true);
};

const onMouseDown = function (e) 
{
	if (grabbedMag)
		throw Error('Already dragging a magnet!');

	let id = this.getAttribute('magnet-id');
	debug(`started dragging ${id}`);

	grabbedMag = this;
	grabbedMag.onmouseup = onMouseUp;
	this.style.transition = 'none';
	initialOffset = [e.offsetX, e.offsetY];
	document.getElementById('target').onmousemove = onMouseMove;
};

const onMouseUp = function (e) 
{
	let id = this.getAttribute('magnet-id');

	debug(`stopped dragging ${id}`);
	grabbedMag.style.transition = null;

	grabbedMag.onmouseup = undefined;
	document.getElementById('target').onmousemove = undefined;
	grabbedMag = undefined;

	let px = getEmPixels();	

	socket.emit('move', id, (e.clientX-initialOffset[0])/px, (e.clientY-initialOffset[1])/px, myID);
};

const onMouseMove = function (e)
{
	if (!e.buttons)
		return onMouseUp.call(grabbedMag, e);
	grabbedMag.style.left = (e.clientX-initialOffset[0]) + 'px';
	grabbedMag.style.top  = (e.clientY-initialOffset[1]) + 'px';
};

const connect = () =>
{
	socket.on('init', init);
	socket.on('move', mvMagnet);
	socket.on('user-enter', userEnter);
	socket.on('user-leave', userLeave);

	//bind dragndrop events
};

let socket = SocketIO('/letters');
socket.on('connect', connect);

global.socket = socket;

