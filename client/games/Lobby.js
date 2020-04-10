class Lobby {

    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.container.innerHTML = lobbyHTML;
    }
    update(room){
        document.getElementById("roomTitle").innerHTML = "Room: "+room.name;
		document.getElementById("startGame").style.display = (room.admin === globals.playerId)? "inline-block":"none";
		document.getElementById("menuPlayers").innerHTML = '';
		for(let p in room.players){
			document.getElementById("menuPlayers").innerHTML+=getMenuPlayerItem(room.players[p],room.admin)
		}
    }

}

function getMenuPlayerItem(plr){
	//console.log(plr)
	return '<li class="player-name">'+plr.name+'</li>'
}

let lobbyHTML = `<h1 id="roomTitle">Room: test</h1>
		<button id="startGame" class="smallerIntroButton" onclick="startGame()" >Start Game</button>

		<h3>Players</h3>
		<ul id="menuPlayers" class="lobby-player-list">
			<!--<li>Coffee</li>-->
			<!--<li>Tea</li>-->
			<!--<li>Milk</li>-->
		</ul>
		</br>
		<button id="leaveRoom" class="smallerIntroButton" onclick="leaveRoom()">Leave The Room</button>`;
