class Lobby {

    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.roomTitle = document.getElementById("roomTitle");
        this.startGame = document.getElementById("startGame");
        this.menuPlayers = document.getElementById("menuPlayers");
        this.playerList = [];
    }
    update(){
        if(!globals.inRoom){
            return;
        }
        this.roomTitle.innerHTML = "Room: "+globals.room.name;
		this.startGame.style.display = (globals.room.admin === globals.playerId)? "inline-block":"none";

		//assumes that players cant change their names
		if(globals.room.players.length !== this.playerList.length){
            this.playerList = globals.room.players;
            let menuPlayersContent = '';
            for(let p= 0; p< globals.room.players.length; p++){
                menuPlayersContent += getMenuPlayerItem(globals.room.players[p],globals.room.admin,globals.room.id)
            }
            this.menuPlayers.innerHTML = menuPlayersContent;
        }

    }

}

function getMenuPlayerItem(plr,adminId,roomId){
    let isAdmin = plr.id === adminId;
    if(isAdmin){
        let color1 = "#" + roomId;
        let color2 = "#" + adminId;

        //https://stripesgenerator.com/
        let stripes = `background-image: linear-gradient(45deg, ${color1} 16.67%, ${color2} 16.67%, ${color2} 50%, ${color1} 50%, ${color1} 66.67%, ${color2} 66.67%, ${color2} 100%);`
        return `<div class="player-name admin unselectable" style="${stripes}"><p class="player-name-text">${plr.name}</p></div>`
    }

    return `<div class="player-name unselectable" style="color:#${plr.id}"><p class="player-name-text">${plr.name}</p></div>`

}
