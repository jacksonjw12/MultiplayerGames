
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
document.getElementById("playerNameInput").addEventListener("keyup", function(event) {
	if (event.key === "Enter") {
		changeName();
	}
});
/*
=============================================================================================
										page_rooms
=============================================================================================
*/

function receiveRooms(data){
	let body = document.getElementById("roomTableBody");
	let scrollPosition = body.scrollTop;
	let htmlContents = "";
	for(let r = 0; r<data.rooms.length; r++){
		let room = data.rooms[r];

		htmlContents += '<div class="tableRow">';
		htmlContents += `<div class="tableBodyElement"><div class="tableBodyElementContent" ><u style="color:#${room.id}">${room.name}</u></div></div>`;
		htmlContents += `<div class="tableBodyElement"><div class="tableBodyElementContent"> ${room.numPlayers}</div></div>`;
		htmlContents += `<div class="tableBodyElement"><div class="tableBodyElementContent">${room.gameType}</div></div>`;
		htmlContents += `<div class="tableBodyElement"><div class="tableBodyElementContent">${room.stage}</div></div>`;
		htmlContents += `<div class="tableBodyElement tableButton" onClick="connectRoom('${room.id}')"><div class="tableBodyElementContent" >Join</div></div>`;
		htmlContents += '</div>';
	}
	body.innerHTML = htmlContents;
	body.scrollTop = scrollPosition;
}

function createNewRoom(){
	changePage("createRoom");
}
function connectRoom(roomId){
	if(globals.debug){
		console.log("Connecting to", roomId);
	}

	globals.socket.emit('joinRoom',{"roomId":roomId})

}
/*
=============================================================================================
										page_newRoom
=============================================================================================
*/
// CreateRoom.js holds most functionality for this page

function hideCreateNewRoom(){
	changePage("rooms");
}

/*
=============================================================================================
											page_game & page_lobby
=============================================================================================
*/

//General game controls that will likely remain the same across multiple games

function startGame(){
	globals.socket.emit("startGame",{})
}

function endGame(){
	globals.socket.emit("endGame",{})
}

function leaveRoom(){
	globals.socket.emit('leaveRoom',{})
}

//Loads the game, and handles updates
function gameUpdate(){
	if(!globals.inRoom){
		return;//dont update game if no room
	}
	if(globals.room.stage !== "game"){
		return;//dont update game if room is in lobby
	}

	if(globals.debug){
		console.log("Game Update: ",globals.room.game);
	}

	//if game is not yet running, start a new game
	if(!globals.gameRunning){
		globals.gameRunning = true;
		if(globals.room.gameType === "SpyFall"){
			globals.game = new SpyFall("page_game",globals.room);
		}
		else{
			globals.gameRunning = false;
			console.log("This is not a supported gameType")
			return;
		}

	}
	globals.game.update(globals.room.game,globals.room)
}


/*
=============================================================================================
										Main Logic, and socket handlers
============================================================================================

*/
let debug = true;
const globals = {
	debug,
	playerId:"ffffff",
	playerName: "",
	socket: {emit:()=>{console.log("socket connection not yet created")}},
	page:"welcome", //welcome, welcomeWithName, rooms, createRoom, room, game
	inRoom:false,
	roomBars: false,
	room: {},
	gameRunning: false,
	game: {},
	createRoom:new CreateRoom("page_createRoom"),
	lobby: new Lobby("page_lobby"),
	debugController: (debug)?(new DebugWindowController(
		[
			{"id":"page_welcome","name":"welcome"},
			{"id":"page_welcomeWithName","name":"welcomeWithName"},
			{"id":"page_rooms","name":"rooms"},
			{"id":"page_createRoom","name":"createRoom"},
			{"id":"page_lobby","name":"lobby"},
			{"id":"page_game","name":"game"}
		]
	)):{},
};

function initializeSocketHandlers(){
	globals.socket.on('playerSync', playerSync);

	globals.socket.on('receiveRooms', receiveRooms);
	globals.socket.on('errorMessage', function(data){
		console.log(data.err);
		alert(data.err);//todo: make this fancier?
	})
}
function playerSync(player) {
	if(globals.debug){
		console.log("Doing player sync",player);
	}
	globals.room = player.room;
	globals.playerName = player.name;
	globals.inRoom = player.inRoom;

	if(globals.inRoom){
		//update the persistent lobby with new room data
		globals.lobby.update();
		if(globals.lobby.stage === "game"){
			gameUpdate();
		}
		else{//destroy ended games
			globals.gameRunning = false;
			globals.game = {};
		}
	}
	changePage();
}

function changePage(forcePage){
	if(forcePage === undefined){
		if(globals.inRoom){
			globals.page = globals.room.stage;
		}
		else{//Default screen is the room listing
			globals.page = "rooms";

			//refresh rooms
			globals.socket.emit("getRooms",{});
			window.setTimeout(()=>{if(globals.page === "rooms"){changePage()}},6000)
		}
	}
	else{
		globals.page = forcePage;
	}

	//Show correct pages
	document.getElementById("page_welcome").style.display = (globals.page === "welcome")? "flex":"none";
	document.getElementById("page_welcomeWithName").style.display = (globals.page === "welcomeWithName")? "flex":"none";
	document.getElementById("page_rooms").style.display = (globals.page === "rooms")? "flex":"none";
	document.getElementById("page_createRoom").style.display = (globals.page === "createRoom")? "flex":"none";

	// lobby and game pages are grouped under the room_pages so that the room bars are preserved from game <--> lobby
	document.getElementById("room_pages").style.display = (globals.page === "lobby" || globals.page ==="game")? "flex":"none";
	document.getElementById("page_lobby").style.display = (globals.page === "lobby")? "flex":"none";
	document.getElementById("page_game").style.display = (globals.page === "game")? "flex":"none";

	//room bars logic, they are delayed so that it aligns better with the player bars(otherwise ugly looking on refreshh)
	if(globals.inRoom && !globals.roomBars){
		globals.roomBars = true;
		let leftBorder = document.getElementById("roomLeftBorder");
		let rightBorder = document.getElementById("roomRightBorder");
		leftBorder.style.backgroundColor = "#" + globals.room.id;
		rightBorder.style.backgroundColor = "#" + globals.room.id;
		window.setTimeout(()=>{
			leftBorder.classList.add("pageBorderVisible");
			rightBorder.classList.add("pageBorderVisible");
		},800)
	}
	else if(!globals.inRoom && globals.roomBars){
		globals.roomBars = false;
		let leftBorder = document.getElementById("roomLeftBorder");
		let rightBorder = document.getElementById("roomRightBorder");
		window.setTimeout(()=>{
			leftBorder.classList.remove("pageBorderVisible");
			rightBorder.classList.remove("pageBorderVisible");
		},800)
	}
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

function main(){

	get('authorize',function(res){

		if(globals.debug){
			console.log("Authorized as player: ",res.playerId," with name: ",res.playerName);
		}
		globals.playerId = res.playerId;
		globals.playerName = res.playerName;
		globals.socket = io({
			query: {
				token: res.playerId
			}
		});
		//Setup Player id colored borders
		let leftBorder = document.getElementById("pageLeftBorder");
		let rightBorder = document.getElementById("pageRightBorder");
		leftBorder.style.backgroundColor = "#" + res.playerId;
		rightBorder.style.backgroundColor = "#" + res.playerId;
		leftBorder.classList.add("pageBorderVisible");
		rightBorder.classList.add("pageBorderVisible");

		initializeSocketHandlers(globals.socket);

		//If player has not set a name, prompt them to do so
		if(res.playerName === res.playerId) {//in case this is a new user
            changePage("welcomeWithName");
        }
        else{//this user is ready to be synced,
        	globals.socket.emit('requestPlayerSync',{})
		}
	})
}

main();
