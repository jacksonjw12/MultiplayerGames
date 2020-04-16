import SpyFallGame from './SpyFallGame';
import PlayerList from './PlayerList'

export default class Room extends PlayerList{

	constructor(roomName, gameType, gameOptions, permanent){
        super();

        this.id = Room.makeId();
        this.name = (roomName === undefined) ? this.id : roomName;

        this.gameOptions = gameOptions;
		this.stage = "lobby";//lobby, game
        this.game = {};
        this.gameType =  gameType;
        this.permanentRoom = (permanent !== undefined)?permanent:false;
		this.adminId = undefined;
        Room.registerRoom(this)
	}
    sendMessage(msg){
	    //TODO: send notification message to all players
    }
    addPlayer(player,socket){
	    if(this.players.length > 7){
	        return;
        }
	    super.addPlayer(player,(r)=>{
	        if(r.err){
	            socket.emit("errorMessage",{"err":r.err});
            }
            else{
                r.player.subscribeSockets(this.id);
                if(this.players.length === 1 || this.realPlayers === 1){
                    this.adminId = player.id;
                }
                this.forcePlayerSync();
            }
        })
    }
    removePlayer(player, socket){
	    super.removePlayer(player,(r)=>{
	        if(r.err){
	            socket.emit("errorMessage",{"err":r.err});
            }
            else{
               player.unsubscribeSockets();
               this.handlePlayerLeave(player);
            }
        });
    }

    handlePlayerLeave(player){
	    if(this.players.length === 0 && !this.permanentRoom){
	        //end the room
            Room.removeRoom(this);
            return;
        }

	    if(this.adminId === player.id && this.players.length > 0){
	        console.log("New Admin selected for room :",this.id);
	        this.adminId = this.players[0].id;//new admin selected as first player
        }

	    if(this.stage === "game"){
	        this.game.handlePlayerLeave(player);
        }
        this.forcePlayerSync();
    }

    startGame(socket){

	    if(this.stage === "lobby" && SpyFallGame.evaluateRoomReadyState(this)){
	        this.stage = "game";
	        if(this.gameType === "SpyFall"){
	            this.game = new SpyFallGame(this);
            }
            else{
                this.game = {}
            }

	        this.forcePlayerSync();
        }
        else{
            socket.emit("errorMessage",{"err":"Room is not ready to start a new game(3-8 players and in lobby screen)"});
        }
    }
    endGame(){
	    if(this.stage === "game"){
	        this.stage = "lobby";
	        this.game = {};
	        this.forcePlayerSync();
        }
    }

    forcePlayerSync(){
	    for(let p = 0; p < this.players.length; p++){
	        this.players[p].forcePlayerSync(this);
        }
    }


    getSafe(player){
	    //assume when player is not passed its a player not in the room whos trying to get info
	    return {
	        "id":this.id,
            "name":this.name,
            "admin":this.adminId,
            "stage":this.stage,
            "game":(this.stage === "game" && player !== undefined)?this.game.getGamePlayerData(player):undefined,//dont give game info to outsiders
            "gameType":this.gameType,
            "numPlayers":this.players.length,
            "players":(player === undefined)?[]:this.playersSafe//when in the game room list, no need to pass player data to recepient
	    };


    }

    static removeRoom(room){
	    for(let i = 0; i< Room.rooms.length; i++){
	        if(Room.rooms[i].id === room.id){
	            Room.rooms.splice(i,1);
	            return;
            }
        }
    }

    static get(id){
	    for(let i = 0; i< Room.rooms.length; i++){
            if (Room.rooms[i].id === id){
                return Room.rooms[i];
            }
        }
        return undefined;
    }

    static registerRoom(room){
        Room.rooms.push(room);
    }
    static makeId(){
	    let foundGoodId = false;
        while(!foundGoodId){
            let id = makeId();
            let isBad = false;
            for(let i = 0; i< Room.rooms.length; i++){
                if (Room.rooms[i].id === id){
                    isBad = true;
                    break;
                }
            }
            if(!isBad){
                foundGoodId = true;
                return id;
            }
        }
    }

    static getRoomsSafe(){
	    let safeRooms = [];
	    for(let r = 0; r< Room.rooms.length; r++){
	        let room = Room.rooms[r];

	        safeRooms.push(room.getSafe())
        }
        return safeRooms;
    }


};
Room.rooms = [];


function makeId()
{
    let text = "";
    let possible = "ABCDE0123456789";//no F because we don't want the possibility of a totally white color

    for(let i = 0; i < 6; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

export let room1 = new Room("Room 1","SpyFall",{"playWithSpyFall":true},true);

export let room2 = new Room("Room 2","SpyFall",{"playWithSpyFall":false},true);
for(let i = 3; i < 50; i++){
    new Room("Room " + i,"SpyFall",{"playWithSpyFall":true},true);
}
