/*
   Rules for Spyfall
   Min Players: 3
   GameTypes:
    Normal Spyfall 95% of games
        1 player is chosen as the spy, the admin is denoted as the player who goes first
        Win Condition for innocents
            During a voting session, a spy is nominated, and receives either 100% or 75% of the vote?
            During a voting session, a spy selects the "Everyone is a spy including me" button
        Win Condition for spy
            During a voting session, an innocent is nominated, and receives either 100% or 75% of the vote?

    Spyfull 5% of games
        Every player is a spy
        Win condition for a player
            During a nomination, the player selects the "Everyone is a spy including me" button

    Nominations
        Innocents receive a list of every other player
        Spies receive the same, and in addition, a "everyone is a spy including me"
 */

import {locations} from "../locations";

export default class SpyFallServer{

	constructor(room){

		this.room = room;
        this.gameOptions = this.room.gameOptions;

		this.playerData = [];
        this.players = [];
        this.votingData = {};
        this.gameOverReason = {"code":undefined,"description":""};

		this.location = locations[Math.floor(Math.random()*locations.length)];
        this.scene = undefined;//default, vote, results



        this.spyFullAllowed = this.gameOptions.playWithSpyFull;

        this.spyFullGame = false;
        if(Math.random() > .50 && this.spyFullAllowed){
            this.spyFullGame = true;
            this.createSpyFullGame();
        }
        else{
            this.createNewGame(this.location);
        }
        this.firstPlayerId = this.room.players[Math.floor(this.room.players.length*Math.random())].id;



	}
	createNewGame(){

	    let spy = Math.floor(Math.random()*this.room.players.length);
	    this.room.getAdmin((admin,adminIndex)=>{
	       if(admin !== undefined && admin.name === "secretSpy"){
	           spy = adminIndex;

           }
        });
	    let roles = this.location.roles.map((r) =>({sort: Math.random(), value: r})).sort((a, b) => a.sort - b.sort);
        let roleIndex = 0;
	    for(let p = 0; p < this.room.players.length; p++){
            this.playerData.push({"id":this.room.players[p].id,"name":this.room.players[p].name,"identity":(p === spy)?"spy":"innocent","role":(p === spy)?"":roles[roleIndex].value,"canNominate":true});
            this.players.push({"id":this.room.players[p].id,"name":this.room.players[p].name,"dummy":this.room.players[p].dummy})
            if(p !== spy){
                roleIndex++;
            }
	    }
	    this.scene ="default";
    }
    createSpyFullGame(){

        for(let p = 0; p < this.room.players.length; p++){
            this.playerData.push({"id":this.room.players[p].id,"name":this.room.players[p].name,"identity":"spy","role":"","canNominate":true});
            this.players.push({"id":this.room.players[p].id,"name":this.room.players[p].name,"dummy":this.room.players[p].dummy})
        }
        this.scene ="default";
    }
    resolveGame(reasonCode,reasonDescription, skipResults){
	    skipResults = (skipResults !== undefined)?skipResults:false;
	    console.log("Ending Game because: ", reasonCode);
	    this.gameOverReason = {"code":reasonCode,"description":reasonDescription,"spyFullGame":this.spyFullGame,"location":this.location.name};

	    if(!skipResults){
	        this.scene = "results";
            this.room.forcePlayerSync();
            setTimeout(()=>{
                this.room.endGame();
            },10000)
        }
	    else{
	        this.room.endGame();
        }


    }
    handleGameInteraction(interaction,socket){
	    if(interaction.type === "nomination"){

	        this.handleNomination(interaction,socket)
        }
        else if(interaction.type === "vote"){
            this.handleVote(interaction,socket);
        }
        else if(interaction.type === "guessLocation"){
            this.handleGuessLocation(interaction,socket);
        }
    }

    startVote(nominator, nominee){

        this.scene = "vote";
        let nomineeGuilty = nominee.playerData.identity === "spy";
        this.votingData = {
            "voteId":nominator.id + nominee.id,
            "votingResults":[],
            "finishedVoting":[{"id":nominator.id},{"id":nominee.playerData.id}],
            "nominatorId":nominator.id,
            "nominatorName":nominator.name,
            "nomineeId":nominee.playerData.id,
            "nomineeName":nominee.playerData.name,
            "nomineeGuilty":nomineeGuilty
        };

        if(this.room.realPlayers !== this.room.players.length){
            for(let p = 0; p<this.players.length; p++){
                console.log(this.players[p])
                if(this.players[p].dummy && this.players[p].id !== nominee.playerData.id){
                    this.votingData.votingResults.push({"id":this.players[p].id,"guilty":true});
                    this.votingData.finishedVoting.push({"id":this.players[p].id});
                }
            }
        }

        if(this.votingData.votingResults.length >= this.players.length-2){
            console.log("resolving vote")
            this.resolveVote(true);
        }
        else{
            this.room.forcePlayerSync();

        }


    }
    handleGuessLocation(interaction, socket){
	    if(this.scene !== "default"){
	        socket.emit("errorMessage",{"err":"You are unable to do that at this time"});
        }
	    let player = this.getGamePlayerData(socket.player);
	    if(player.playerData.identity === "spy"){
	        if(interaction.locationName === this.location.name && !this.spyFullGame){
	            this.resolveGame("successfulSpyGuess","The Spy Guessed The Location, Innocents Lose!");
            }
            else if(!this.spyFullGame){
                this.resolveGame("wrongSpyGuess", "The Spy Guessed The Wrong Location, Innocents Win!");
            }
            else{
                this.resolveGame("spyFullFail", `<span class="player-name-text" style="text-decoration-color:#${socket.player.id}">${socket.player.name}</span> Guessed a Location, But You Were All Spies! They Lose!`);

            }
        }
        else{
            socket.emit("errorMessage",{"err":"Only spies are allowed to guess the location"});

        }
    }
    resolveVote(votePassed){
	    let nominationsLeft = 0;
	    for(let p = 0; p < this.playerData.length; p++){
            if(this.playerData[p].canNominate){
                nominationsLeft++;
            }
        }
	    if(votePassed && this.votingData.nomineeGuilty){
            if(this.spyFullGame){
                this.resolveGame("spyFullFailed","Everyone Loses, You Were All Spies!")
            }
            else{
                this.resolveGame("spyFound", "The Spy Was Found, Innocents Win!")
            }
        }
        else if(votePassed){
            this.resolveGame("spyNotFound", "Wrong Guess, The Spy Wins!")
        }
        else{
            if(nominationsLeft === 0){
                 if(this.spyFullGame){
                    this.resolveGame("spyFullFailed","You Were All Spies! But You Used Up All The Nominations. So Everyone Loses.")

                 }
                 else{
                    this.resolveGame("noNominations","Everyone Ran Out Of Guesses, The Spy Wins!")

                 }
            }
            else{
                this.room.sendMessageToPlayers("The vote has failed",{"autoClose":true});
                this.scene = "default";
                this.room.forcePlayerSync();
            }

        }

    }
    handleVote(interaction, socket){
        if(socket.player.id === this.votingData.nominatorId || socket.player.id === this.votingData.nomineeId){
	        socket.emit("errorMessage",{"err":"You are not allowed to vote"});
        }
        else{
            let expectedNumVoters = this.players.length - 2;
            let votePassed = true;
            for(let p = 0; p < this.votingData.votingResults.length; p++){
                if(this.votingData.votingResults[p].id === socket.player.id){
                    socket.emit("errorMessage",{"err":"You have already voted"});
                    return;
                }
                votePassed = votePassed && this.votingData.votingResults[p].guilty;
            }
            votePassed = votePassed && interaction.guilty;

            this.votingData.votingResults.push({"id":socket.player.id,"guilty":interaction.guilty});
            this.votingData.finishedVoting.push({"id":socket.player.id});

            if(this.votingData.votingResults.length >= expectedNumVoters) {
                this.resolveVote(votePassed);
            }
            else{
                //update voting info
                this.room.forcePlayerSync();
            }

        }

    }



    handleNomination(interaction,socket){
	    if(this.scene !== "default"){
	        socket.emit("errorMessage",{"err":"That can't be done at this time"});
	        return;
        }

        let playerData = {};
	    for(let p = 0; p < this.playerData.length; p++){
	        if(this.playerData[p].id === socket.player.id){
	            playerData = this.playerData[p];
	            break;
            }
        }

	    if(playerData.canNominate){
            if(interaction.nominateEveryone){
                if(this.spyFullAllowed){
                    if(playerData.identity !== "spy"){
                        socket.emit("errorMessage",{"err":"Only spies are allowed to pick that option"});
                        return;
                    }
                    if(this.spyFullGame){

                        this.resolveGame("correctSpyFullGuess",`<span class="player-name-text" style="text-decoration-color:#${playerData.id}">${playerData.name}</span> Figured Out Everyone Was A Spy, So They Win.`);
                    }
                    else{
                        this.resolveGame("incorrectSpyFullGuess", "Innocents Win, The Spy Thought Everyone Else Was A Spy.");
                    }
                }
                else{
                    socket.emit("errorMessage",{"err":"This game has no possibility of being a SpyFull game, this should not happen"});
                }
            }
            else{
                playerData.canNominate = false;

                this.startVote(socket.player,this.getGamePlayerData(interaction.nomineeId,true));
            }
        }
        else{
            socket.emit("errorMessage",{"err":"You are not allowed to nominate a spy"});
        }

    }

    handlePlayerLeave(player){
	    if(this.scene === "results"){
	        return;//do nothing
        }
	    if(this.room.realPlayers === 0){
	        this.resolveGame("noRealPlayers","Only bots left in room, returning to lobby",true);
        }
        for(let p = 0; p < this.playerData.length; p++) {
            if (player.id === this.playerData[p].id) {
                if(this.playerData[p].identity === "spy" && !this.spyFullGame){
                    this.resolveGame("spyLeft","The Spy Disconnected From The Game, Returning To Lobby.");
                }
                else if(this.playerData.length === 3){
                    this.resolveGame("notEnoughPlayers","Not Enough Players Left In The Game, Returning To Lobby.");
                }
                else{
                    this.playerData.splice(p,1);
                    this.players.splice(p,1);
                }
            }
        }

    }
    getCleanVotingData(){
	    if(this.scene === "vote"){
	        return {
	            "nominatorId":this.votingData.nominatorId,
                "nominatorName":this.votingData.nominatorName,
                "numLeftToVote":this.players.length - this.votingData.finishedVoting.length,
                "nomineeId":this.votingData.nomineeId,
                "nomineeName":this.votingData.nomineeName,
                "finishedVoting": this.votingData.finishedVoting
	        }
        }
	    return {}
    }
    getGamePlayerData(player,byId){

	    let data = {
	        "scene": this.scene,
            "players":this.players,
            "firstPlayerId":this.firstPlayerId,
            "spyFullAllowed":this.spyFullAllowed,
            "votingData":this.getCleanVotingData(),
            "gameOverReason":this.gameOverReason
	    };

	    for(let p = 0; p < this.playerData.length; p++){
	        if((byId?player:player.id) === this.playerData[p].id){
                if(this.scene === "results"){
                    return {
                        ...data,
                        "playerData":this.playerData[p],
                        "results":this.playerData,
                        "location":this.location.name
                    }
                }
	            return {
                    ...data,
                    "playerData":this.playerData[p],
                    "location":(this.playerData[p].identity === "innocent")?this.location.name:""
                };
            }
        }
        return {
	        ...data,
            "playerData":{"id":player.id,"identity":"spectator","role":"","canNominate":false},
            "location":""
	    }

    }


	//can a game be created;
	static evaluateRoomReadyState(room){
	    if(room.players.length >= 3 && room.players.length <= 8){
	        return true;
        }
        return false;
    }

};


