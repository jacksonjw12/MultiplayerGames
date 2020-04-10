import initializeSockets, {authorize} from "./requestHandlers";
import express from 'express';

import Player from './models/Player.js';
import Room from './models/Room.js';

function start() {
	let app = express();
	app.use(express.json());

	app.use(express.static(__dirname + '/client'));
	app.use(express.static(__dirname + '/media'));

	app.get('/', function (req, res) {
		res.sendFile(__dirname + '/html/index.html')
	});

	app.get('/debug',function(req,res) {
		console.log(Room.rooms);
		console.log(Player.players);
		res.send({})
	})
	// app.get('/listRooms',listRooms);
	// app.get('/listRoomsExtended',listRoomsExtended);

	app.get('/authorize',authorize);

	//I use this to manually change the port when it is being deployed sometimes
	let port = 8081;
	if(process.platform === "linux"){
		port = 8081
	}

	let server = app.listen(port);

	initializeSockets(server);
	console.log("Server has started");
}
exports.start = start;
