export let io;

import Player from './models/Player.js';
import Room from './models/Room.js';
import socketio from "socket.io";


export default function initializeSockets(server){


	io = socketio(server);//require('socket.io')(server);


	io.use((socket, next) => {
		let token = socket.handshake.query.token;
		let player = Player.get(token);
		if (player) {
			socket.player = player;
			player.registerSocket(socket);
			return next();
		}
		return next(new Error('authentication error'));
	});

	io.on('connection', function (socket) {

		socket.on('updateName',function(data){

			socket.player.updateName(escapeHtml(data.name));

		});
		socket.on('getRooms', function(){

			socket.emit('receiveRooms', {"rooms":Room.getRoomsSafe()});
		});
		socket.on('joinRoom', function (data){

			let room = Room.get(data.roomId);
			if(room && room.players.length < 8){
				room.addPlayer(socket.player,socket);
			}
			else{
				socket.emit("errorMessage",{"err":"That room no longer exists"});
			}

		});

		socket.on('newRoom',function(data){
			let room = new Room(escapeHtml(data.name), data.gameType, data.gameOptions,false);
			room.addPlayer(socket.player);
		});

		socket.on('leaveRoom',function(){
			let room = Room.get(socket.player.roomId);
			if(socket.player.inRoom){
				room.removePlayer(socket.player);
			}
			else{
				socket.emit("errorMessage",{"err":"You weren't in a room"});

			}

		});


		socket.on('startGame',function(){
			let room = Room.get(socket.player.roomId);
			if(socket.player.inRoom && room.adminId === socket.player.id ){
				room.startGame(socket);
			}
		});
		socket.on('gameInteraction',function(interaction){
			let room = Room.get(socket.player.roomId);
			if(socket.player.inRoom && room.stage === "game"){
				room.game.handleGameInteraction(interaction,socket);
			}
		});


		socket.on('requestPlayerSync', function(){
			let room = Room.get(socket.player.roomId);
			socket.emit('playerSync', {"inRoom":socket.player.inRoom,"room":socket.player.inRoom?room.getSafe(socket.player):undefined,"name":socket.player.name})
		});


		socket.on('disconnect', function (){
			socket.player.disconnectSocket(socket);
			console.log("socket disconnected");

		});


	});



}

//todo: make a password cookie value in player so that id spoofing cant happen
export function authorize(req, res){
	let cookie = req.headers.cookie;
	let player = undefined;
	if(cookie !== undefined){

		let cookieParts = cookie.split('; ');

		let playerId, authCode;
		for(let c = 0; c < cookieParts.length; c++){
			if(cookieParts[c].indexOf("playerId=") > -1){
				playerId = cookieParts[c].substr(9);//playerId=
			}
			else if(cookieParts[c].indexOf("authCode=") > -1){
				authCode = cookieParts[c].substr(9);
			}
		}
		if(playerId !== undefined && authCode !== undefined){
			player = Player.get(playerId,authCode);//returns undefined if no player exists with that id

		}
	}

	if(cookie === undefined || player === undefined){
		player = new Player();
		res.cookie('authCode',player.authCode,{maxAge: 900000});
		res.cookie('playerId', player.id, {maxAge: 900000})
	}
	console.log("player name: " + player.name);
	res.send({"playerId":player.id,"playerName":player.name})
}


function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
 }
