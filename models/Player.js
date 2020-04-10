let maxNameLength = 16;
import {io} from '../requestHandlers';
import Room from './Room';
export default class Player{

	constructor() {
        this.id = Player.makePlayerId();
        this.sockets = [];
        this.name = this.id;
        Player.registerPlayer(this);

        this.inRoom = false;
        this.roomId = undefined;
    }

    subscribeSockets(id){
	    if(this.inRoom){
	        this.unsubscribeSockets()
        }

        for(let s = 0; s< this.sockets.length; s++){
	        this.sockets[s].join(id);
        }
        this.inRoom = true;
        this.roomId = id;
    }

    unsubscribeSockets(){
	    if(this.inRoom){
	         for(let s = 0; s< this.sockets.length; s++){
                this.sockets[s].leave(this.roomId,()=>{});
            }
            this.inRoom = false;
            this.roomId = undefined;
            this.forcePlayerSync();
        }

    }

    forcePlayerSync(room){
	    if(room === undefined && this.inRoom){
	        room = Room.get(this.roomId);
        }

        let syncData = {"inRoom":this.inRoom,"room":this.inRoom?room.getSafe(this):undefined,"name":this.name};

	    io.to('player_'+this.id).emit('playerSync', syncData);
    }
    handleSelfUpdate(){
	    if(this.inRoom){
	        let room = Room.get(this.roomId);
	        room.forcePlayerSync();
        }
        else{
            this.forcePlayerSync();
        }

    }

    updateName(name){
	    this.name = name.substring(0,maxNameLength);
	    this.handleSelfUpdate();
    }
	registerSocket(socket){
	    clearTimeout(this.timeToKick);
	    this.sockets.push(socket);
	    if(this.inRoom){
	        socket.join(this.roomId);
        }
        socket.join("player_"+this.id);
    }

    disconnectSocket(socket){
        for(let s = 0; s< this.sockets.length; s++){
            if(this.sockets[s].id === socket.id){
                this.sockets.splice(s,1);
                if(this.sockets.length === 0){
                    this.timeToKick = setTimeout(()=>{
                        if(this.inRoom && this.sockets.length === 0){
                            Room.get(this.roomId).removePlayer(this);
                            // this.leaveRoom(this.room)
                        }
                        },10000)
                }
                return;
            }
        }
    }


	static makePlayerId(){
	    let foundGoodId = false;
        while(!foundGoodId){
            let id = makeId();
            let isBad = false;
            for(let i = 0; i< Player.players.length; i++){
                if (Player.players[i].id === id){
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


    static registerPlayer(player){
        Player.players.push(player);

    }
    static get(id){
	    for(let i = 0; i< Player.players.length; i++){
            if (Player.players[i].id === id){
                return Player.players[i];
            }
        }
        return undefined;
    }


};
Player.players = [];
function makeId()
{
    let text = "";
    let possible = "ABCDE0123456789";//no F because we don't want the possibility of a totally white color

    for(let i = 0; i < 6; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}
