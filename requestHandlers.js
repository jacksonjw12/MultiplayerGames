export let io;
export let debug = false;

import Player from './models/Player.js';
import Room from './models/Room.js';
import socketio from "socket.io";


function loginPlayer(socket){
	let cookies = cookieParse(socket.handshake.headers.cookie);
	let player = Player.get(cookies.playerId,cookies.authCode);
	if (player) {
		socket.player = player;
		player.registerSocket(socket);
		socket.emit('login',{'authCode':player.authCode,'playerId':player.id})
		return;
	}
	if(debug){
		console.log("Creating new player (invalid cookie or auth data)");
	}

	player = new Player();
	socket.player = player;
	player.registerSocket(socket);
	socket.emit('login',{'authCode':player.authCode,'playerId':player.id})

}
export default function initializeSockets(server){

	io = socketio(server);

	io.use((socket, next) => {
		if(!socket.player){
			console.log("requesting a player login")
			loginPlayer(socket)
		}

		return next();
	});

	io.on('connection', function (socket) {
		socket.on('authentication', function(data){
			// if()
			// authorizePlayer(socket);
			socket.emit('authorization',{"playerId":socket.player.id,"playerName":socket.player.name})
		})
		socket.on('updateName',function(data){

			socket.player.updateName(escapeHtml(data.name));

		});
		socket.on('getRooms', function(){

			socket.emit('receiveRooms', {"rooms":Room.getRoomsSafe()});
		});
		socket.on('joinRoom', function (data){

			let room = Room.get(data.roomId);
			if(room){
				if(room.players.length >= 8){
					socket.emit("errorMessage",{"err":"That room is full"});
					return;
				}
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
		socket.on('endGame',function(){
			let room = Room.get(socket.player.roomId);
			if(socket.player.inRoom && room.adminId === socket.player.id ){
				room.endGame();
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
			console.log("sending a player sync")
			socket.emit('playerSync', {"inRoom":socket.player.inRoom,"room":socket.player.inRoom?room.getSafe(socket.player):undefined,"name":socket.player.name})
		});


		socket.on('disconnect', function (){
			socket.player.disconnectSocket(socket);
			console.log("socket disconnected");

		});
		socket.on('reconnect', function(){
			console.log("got a reconnect call");
		})


	});



}

function cookieParse(cookieString){
	if(cookieString === undefined){
		return {};
	}
	let cookieParts = cookieString.split('; ');
	let cookie = {}
	let playerId, authCode;
	for(let c = 0; c < cookieParts.length; c++){
		let separator = cookieParts[c].indexOf("=");
		let key = cookieParts[c].substring(0,separator);
		let value = cookieParts[c].substring(separator+1);
		cookie[key] = value;
	}
	return cookie;
}

//
// export function authorize(req, res){
// 	let cookie = req.headers.cookie;
// 	let player = undefined;
// 	if(cookie !== undefined){
//
// 		let cookieObj = cookieParse(cookie)
// 		if(cookieObj.playerId !== undefined && cookieObj.authCode !== undefined){
// 			player = Player.get(cookieObj.playerId,cookieObj.authCode);//returns undefined if no player exists with that id
//
// 		}
// 	}
//
// 	if(cookie === undefined || player === undefined){
// 		player = new Player();
// 		res.cookie('authCode',player.authCode,{maxAge: 8 * 3600000});//8 hours
// 		res.cookie('playerId', player.id, {maxAge: 8 * 3600000})
// 	}
// 	console.log("player name: " + player.name);
// 	res.send({"playerId":player.id,"playerName":player.name})
// }
//

function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
 }
