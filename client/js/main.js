
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
}
function giveName(playerName){
	if ( !(/\S/.test(playerName)) || playerName.length > 16){
		console.log("Bad name, all whitespace or length 0 or >16");
   		return false;
	}

	globals.socket.emit("updateName",{"name":playerName});
	changePage("rooms");
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
	//style="background-color:#${room.id};opacity:.5;"
		htmlContents += `<div class="tableRow" onclick="connectRoom('${room.id}')">`;
		htmlContents += `<div class="tableBodyElement"><div class="tableBodyElementContent roomName" ><p style="-webkit-text-decoration-color: #${room.id};text-decoration-color:#${room.id}">${room.name}</p></div></div>`;
		htmlContents += `<div class="tableBodyElement"><div class="tableBodyElementContent"> ${room.numPlayers}</div></div>`;
		htmlContents += `<div class="tableBodyElement"><div class="tableBodyElementContent gameType">${room.gameType}</div></div>`;
		htmlContents += `<div class="tableBodyElement"><div class="tableBodyElementContent">${room.stage}</div></div>`;
		htmlContents += '</div>';
	}
	body.innerHTML = htmlContents;
	body.scrollTop = scrollPosition;

	//Starts out hidden so that
	// document.getElementById("rooms").style.display="block";
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


function hidePopUp(){
	document.getElementById("popUp").style.display = "none";
}
function showPopUp(text){
	if(globals.debug){
		console.log("showing popup: ",text)
	}
	document.getElementById("infoPopUpText").innerHTML = text;
	document.getElementById("popUp").style.display = "flex";

}


/*
=============================================================================================
										Main Logic, and socket handlers
============================================================================================

*/
let debug = true;
const globals = {
	debug,
	lastInFocus:true,
	playerId:"ffffff",
	playerName: "",
	socket: {emit:()=>{console.log("socket connection not yet created")},destroy:()=>{}},
	page:"welcome", //welcome, welcomeWithName, rooms, createRoom, room, game
	inRoom:false,
	roomBars: false,
	room: {},
	gameRunning: false,
	game: {},
	roomReloadTimer:undefined,
	checkSocketTimer:undefined,
	socketReconnectTimer:undefined,
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
		if(globals.room.stage === "game"){
			gameUpdate();
		}
		else{//destroy ended games
			globals.gameRunning = false;
			globals.game = {};
		}
	}
	if(globals.inRoom){
		globals.page = globals.room.stage;
	}
	else if(globals.playerName === globals.playerId) {
		//in case this is a new user
		//If player has not set a name, prompt them to do so
		globals.page = "welcomeWithName";
	}
	else if(globals.page === "welcome"){
		globals.page = "rooms";
	}
	changePage();
}

function changePage(forcePage){
	if(forcePage !== undefined){

		globals.page = forcePage;
	}
	if( !globals.inRoom && (globals.page === "lobby" || globals.page === "game")){
		globals.page = "rooms";
	}

	if(globals.page === "rooms"){
		globals.socket.emit("getRooms",{});
		clearInterval(globals.roomReloadTimer);
		globals.roomReloadTimer = setInterval(()=>{if(globals.page === "rooms"){globals.socket.emit("getRooms",{})}},6000)
	}
	else{
		clearInterval(globals.roomReloadTimer);
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

	if(globals.page === "welcomeWithName"){
		let playerNameInput = document.getElementById('playerNameInput');
		playerNameInput.focus();
		playerNameInput.select();
	}

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


function checkSocketConnection(){

	if(document.hasFocus()){
		if(!globals.lastInFocus){
			if(debug){
				console.log("Manually requesting a player sync")
				// showPopUp("Manually requesting a player sync");
			}
			globals.socket.emit("requestPlayerSync");
		}
		globals.lastInFocus = true;
	}
	else {
		globals.lastInFocus = false;
	}

}


function initializeSocketHandlers(){
	globals.socket.on('playerSync', playerSync);
	globals.socket.on('infoMessage', function(message){
		showPopUp(message.text);
		if(globals.debug){
			console.log(message);
		}
		if(message.options !== undefined){
			if(message.options.autoClose){
				window.setTimeout(()=>{
					hidePopUp();
				},2000)
			}
		}
	})
	globals.socket.on('receiveRooms', receiveRooms);
	globals.socket.on('errorMessage', function(data){
		showPopUp(data.err);
		if(globals.debug){
			console.log(data.err);
		}
	});

}

function login(res){
	if(globals.debug){
		console.log("Authorized as player: ",res.playerId," with name: ",res.playerName);
	}
	setCookie('playerId',res.playerId,7);
	setCookie('authCode',res.authCode,7);
	globals.playerId = res.playerId;
	globals.playerName = res.playerName;

	//Setup Player id colored borders
	let leftBorder = document.getElementById("pageLeftBorder");
	let rightBorder = document.getElementById("pageRightBorder");
	leftBorder.style.backgroundColor = "#" + res.playerId;
	rightBorder.style.backgroundColor = "#" + res.playerId;
	leftBorder.classList.add("pageBorderVisible");
	rightBorder.classList.add("pageBorderVisible");


	// clearInterval(globals.checkSocketTimer);
	globals.checkSocketTimer = setInterval(checkSocketConnection,2000);


	globals.socket.emit('requestPlayerSync',{})
}

//https://github.com/socketio/socket.io/issues/2476#issuecomment-194268303
function connectSocket(reconnect){

	if(globals.socket){
		globals.socket.destroy();
		delete globals.socket;
		globals.socket = undefined;
	}
	globals.socket = io({reconnection:false})
	globals.socket.on('login',login);
	globals.socket.on('connect', initializeSocketHandlers);
	globals.socket.on('disconnect', () => {

		globals.socketReconnectTimer = window.setInterval(() => {
			if (globals.socket.connected) {
				clearInterval(globals.socketReconnectTimer);
				this.interval = undefined;
				return;
			}
			console.log("attempting to reconnect to socket")
			connectSocket();
		}, 5000);
	});
}
function setCookie(cname, cvalue, exdays) {
	let d = new Date();
	d.setTime(d.getTime() + (exdays*24*60*60*1000));
	let expires = "expires="+ d.toUTCString();
	document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

connectSocket();
