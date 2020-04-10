

// function startGame(){
// 	socket.emit("startGame",{})
// }

/*
=============================================================================================
										page_welcomeWithName
=============================================================================================
*/


function changeName(){
	let success = giveName(document.getElementById("playerNameInput").value);
	if(!success){
		alert("Please enter a valid name (less than 16 characters)");
	}
	else{
		globals.socket.emit('requestPlayerSync',{})
	}


}
function giveName(playerName){
	if ( !(/\S/.test(playerName)) || playerName.length > 16){
		console.log("Bad name, all whitespace or length 0 or >16");
   		return false;
	}

	globals.socket.emit("updateName",{"name":playerName});
	return true;
}
/*
=============================================================================================
										page_rooms
=============================================================================================

*/


function createNewRoom(){
	changePage("createRoom");
}
function connectRoom(roomId){

	console.log(roomId);
	globals.socket.emit('joinRoom',{"roomId":roomId})

}
/*
=============================================================================================
										page_newRoom
=============================================================================================

*/

function handleGameSelect(e){
	let game = e.value;
	if(game === "SpyFall"){
		document.getElementById("gamesSelectionOptions").innerHTML = SpyFall.getGameOptionsHTML();
	}

}


function newRoom(){
	let roomName = document.getElementById("roomNameInput").value;
	let gameType = document.getElementById("gameSelection").value;
	let gameOptions;
	if(gameType === "SpyFall"){
		gameOptions = SpyFall.readGameOptions();
	}
	else{
		alert("Please select a game");
		console.log("no game selected");
		return;
	}

	if ( !(/\S/.test(roomName)) || roomName.length > 16) {
        alert("Please enter a valid name (less than 16 characters)");
        return false;
    }
    else{
    	globals.socket.emit('newRoom',{"name":roomName,"gameOptions":gameOptions,"gameType":gameType});
	}


}
function hideCreateNewRoom(){
	changePage("rooms");
}


/*
=============================================================================================
											page_game
=============================================================================================
*/



function startGame(){
	globals.socket.emit("startGame",{})
}

function endGame(){
	globals.socket.emit("endGame",{})
}



function leaveRoom(){
	globals.socket.emit('leaveRoom',{})
}


function gameUpdate(){
	console.log("game update: ",globals.room.game);

	if(emptyObject(globals.game)){
		globals.game = new SpyFall("page_game",globals.room);
	}
	globals.game.update(globals.room.game,globals.room)
}


/*
=============================================================================================
										Main Logic, and socket handlers
============================================================================================

*/

const globals = {
	playerId:"#ffffff",
	playerName: "",
	socket: {emit:()=>{console.log("socket connection not yet created")}},
	page:"welcome", //welcome, welcomeWithName, rooms, createRoom, game
	inRoom:false,
	game: {},
	lobby: new Lobby("page_lobby"),
	room: {}

};
function initializeSocketHandlers(){
	globals.socket.on('playerSync', function (player) {
		console.log("Doing player sync");
		globals.room = player.room;
		globals.playerName = player.name;
		globals.inRoom = player.inRoom;
		changePage();


	});
	// globals.socket.on('roomSync', function(room){
	// 	console.log("Doing room sync");
	// 	globals.room = room;
	//
	//
	// })
	globals.socket.on('receiveRooms', function(data){
		console.log("updating Rooms");

		let header = "<h2 >Current Rooms</h2><table class='roomTable' style='text-align:center;'><tr><th>Name</th><th># Players</th><th></th></tr>";
		let body = "";
		for(let r in data.rooms){

			let room = data.rooms[r];
			body += "<tr><td>" + room.name + "</td><td>" + room.numPlayers + '</td><td><button class="connectButton" onclick="connectRoom('+"'"+ room.id +"'"+')">Connect</button</td</tr>';

		}

		document.getElementById('rooms').innerHTML = header + body;
	});
	globals.socket.on('errorMessage', function(data){
		console.log(data.err);
	})
}

function main(){

	get('authorize',function(res){
		console.log("Authorized as player: ",res.playerId," with name: ",res.playerName);

		globals.playerId = res.playerId;
		globals.playerName = res.playerName;

		globals.socket = io({
			query: {
				token: res.playerId
			}
		});

		initializeSocketHandlers(globals.socket);

		if(res.playerName === res.playerId) {//in case this is a new user

            globals.page = "welcomeWithName";
            document.getElementById("page_welcome").style.display = "none";
			document.getElementById("page_welcomeWithName").style.display = "block";
        }
        else{//this user is ready to be synced
        	globals.socket.emit('requestPlayerSync',{})
		}


	})


}

function changePage(forcePage){
	if(forcePage === undefined){
		if(globals.inRoom){
			//roomSetup
			if(globals.room.stage === "lobby"){
				globals.page = "lobby";
				globals.lobby.update(globals.room)
			}
			else{
				globals.page = "game";
				gameUpdate();
			}
		}
		else{
			globals.page = "rooms";
			globals.socket.emit("getRooms",{});
			window.setTimeout(()=>{if(globals.page === "rooms"){changePage()}},6000)
		}
	}
	else{
		globals.page = forcePage;
	}


	document.getElementById("page_welcome").style.display = (globals.page === "welcome")? "block":"none";
	document.getElementById("page_welcomeWithName").style.display = (globals.page === "welcomeWithName")? "block":"none";
	document.getElementById("page_rooms").style.display = (globals.page === "rooms")? "block":"none";
	document.getElementById("page_createRoom").style.display = (globals.page === "createRoom")? "block":"none";
	document.getElementById("page_lobby").style.display = (globals.page === "lobby")? "block":"none";
	document.getElementById("page_game").style.display = (globals.page === "game")? "block":"none";







}





function get(location,callback){
	let xmlHttp = new XMLHttpRequest();
	xmlHttp.onreadystatechange = function() {
		if(xmlHttp.readyState === 4 && xmlHttp.status === 200){
			callback(JSON.parse(xmlHttp.responseText));
		}
	};
	xmlHttp.open("GET", location, true); // true for asynchronous
	xmlHttp.send({});
}




window.onload = function(){

	document.getElementById("playerNameInput").addEventListener("keyup", function(event) {
		if (event.key === "Enter") {
			changeName();
		}
	});
	document.getElementById("roomNameInput").addEventListener("keyup", function(event) {
		if (event.key === "Enter") {
			newRoom();
		}
	});
};


function emptyObject(obj){//https://stackoverflow.com/questions/679915/how-do-i-test-for-an-empty-javascript-object
	for(let prop in obj) {
		if(obj.hasOwnProperty(prop)) {
			return false;
		}
	}

	return JSON.stringify(obj) === JSON.stringify({});
}

main();
