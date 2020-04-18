let maxNameLength = 16;
import {io,debug} from '../requestHandlers';
import Room,{room1,room2} from './Room';
export default class Player{

	constructor(dummy) {
        this.id = Player.makePlayerId();
        this.authCode = makeId();
        this.sockets = [];
        this.disconnected = false;
        this.dummy = (dummy !== undefined)?dummy:false;
        this.name =  (!this.dummy)?this.id:generateName(16);
        Player.registerPlayer(this);
        this.inRoom = false;
        this.roomId = undefined;

    }
    sendMessage(msg, options){
	    if(!this.dummy){
	        io.to('player_'+this.id).emit('infoMessage', {"message":msg,"options":options});
        }
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
	    if(this.dummy){
	        return;
        }
	    if(room === undefined && this.inRoom){
	        room = Room.get(this.roomId);
        }

        let syncData = {"inRoom":this.inRoom,"room":this.inRoom?room.getSafe(this):undefined,"name":this.name};
        if(debug){
            console.log("forcing player sync")
        }

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
	    if(this.disconnected){
	        this.disconnected = false;
            // Room.get(this.roomId).forcePlayerSync(this);
        }
	    this.sockets.push(socket);
	    if(this.inRoom){
	        socket.join(this.roomId);
        }
        socket.join("player_"+this.id);
    }

    disconnectSocket(socket){
	    if(debug){
	        console.log(`Disconnecting a socket from a Player, now has ${this.sockets.length-1} sockets`)
        }
        for(let s = 0; s< this.sockets.length; s++){
            if(this.sockets[s].id === socket.id){
                this.sockets.splice(s,1);
                if(this.sockets.length === 0){
                    this.timeToKick = setTimeout(()=>{
                        if(this.inRoom && this.sockets.length === 0){
                            this.disconnected = true;
                            // Room.get(this.roomId).forcePlayerSync(this);
                            // Room.get(this.roomId).setPlayerDisconnected(this);
                            // this.leaveRoom(this.room)
                        }
                        },20000)
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
    static get(id,authCode){
	    for(let i = 0; i< Player.players.length; i++){
            if (Player.players[i].id === id){
                if(authCode !== undefined){
                    if(Player.players[i].authCode === authCode){
                        return Player.players[i]
                    }
                    return undefined;
                }
                return Player.players[i];
            }
        }
        return undefined;
    }


};
Player.players = [];

for(let i = 0; i <6; i++){
    room1.addPlayer(new Player(true));
}

for(let i = 0; i <6; i++){
    room2.addPlayer(new Player(true));
}

function makeId()
{
    let text = "";
    let possible = "ABCDE0123456789";//no F because we don't want the possibility of a totally white color

    for(let i = 0; i < 6; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

function generateName(length){
    let text = "";
    let possible = "abcdefghijklmnopqrstuvwxyz";
    let minWordLength = 3;
    let maxWordLength = 8;
    let done = false;
    while(!done){
        let wordLength = Math.random()*(maxWordLength-minWordLength)+minWordLength;
        if(text.length + wordLength > length){
            done = true;
            return text;
        }
        for(let i = 0; i < wordLength; i++ ){
            let c = possible.charAt(Math.floor(Math.random() * possible.length));
            if(i === 0 && ( (text.length === 0 && Math.random() > .3) || (Math.random() > .7))){
                c = c.toUpperCase()
            }
            text += c;
        }
        if(text.length < length){
            text+=" ";
        }
    }
}
