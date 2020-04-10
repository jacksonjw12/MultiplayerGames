import Player from './Player'
import Room from './Room'
export default class PlayerList {

    constructor() {


        this.players = [];
        this.playersSafe = [];
    }

    addPlayer(player, cb){
        for(let p = 0; p < this.players.length; p++){
            if(this.players[p].id === player.id){

                cb({"err":"User was already a part of this room"});
                return;
            }
            else if(this.players[p].name === player.name){
                cb({"err":"A player in that room has the same name as you, change your name before connecting to this room"});
                return;
            }
        }
        this.players.push(player);
        this.playersSafe.push({"id":player.id,"name":player.name});

        cb({"player":player});
    }
    removePlayer(player,cb){
        for(let p = 0; p< this.players.length; p++){
	        if(this.players[p].id === player.id){
	            let player = this.players.splice(p,1);
	            this.playersSafe.splice(p,1);
	            cb({"player":player});
	            return;
            }
        }
    }


    reGenerateSafePlayersList(){
        for(let p = 0; p< this.players.length; p++){
            this.playersSafe[p] = {"id":this.players[p].id,"name":this.players[p].name};
        }
    }



}
