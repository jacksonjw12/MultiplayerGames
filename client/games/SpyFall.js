class SpyFall {


    constructor(containerId,room) {
        this.room = room;
        this.container = document.getElementById(containerId);
        this.container.innerHTML = spyFallHTML;
        this.game = {};
        this.nominating = false;
        this.guessingLocation = false;
        this.allowedToVote = false;
        this.numPlayers = 0;
        this.shouldInitialize = true;

        this.debugGameController = new DebugGameController(
            [
                {"name":"default","id":"scene_default"},
                {"name":"nominate","id":"scene_nominate"},
                {"name":"guessLocation","id":"scene_guessLocation"},
                {"name":"vote","id":"scene_vote"},
                {"name":"results","id":"scene_results"}

        ],this);

        this.nominatePlayers = document.getElementById("nominatePlayers");
        this.inGamePlayers = document.getElementById("inGamePlayers");



    }
    initialize(){
        if(globals.debug){
            console.log("Initializing Game: ", this.game);
        }
        if(this.room.admin === this.game.playerData.id){
            document.getElementById("endGame").style.display = "inline-block";
        }
        this.identity = this.game.playerData.identity;
        this.role = this.game.playerData.role;
        this.location = this.game.location;

        if(this.identity === "innocent"){
            document.getElementById("location").innerHTML = "Location: " + this.location;
            document.getElementById("role").innerHTML = "Role: " + this.role;
        }
        else if(this.identity === "spy"){
            document.getElementById("location").innerHTML = "You are a spy";
            document.getElementById("role").style.display = "none";
            document.getElementById("showGuessLocationScreen").style.display = "inline-block";
        }
        else{//spectator
            document.getElementById("location").innerHTML = "You are a spectator";
            document.getElementById("role").style.display = "none";
        }

        this.updatePlayerLists();

    }
    updatePlayerLists(){
        let inGamePlayerContent = '';
        let nominatePlayersContent = '';

		for(let p = 0; p < this.game.players.length; p++){
			inGamePlayerContent+=getIGPlayerItem(this.game.players[p],this.game.firstPlayerId);
            nominatePlayersContent+=getNominatePlayerItem(this.game.players[p],this.game.playerData.id);
		}
		if(this.game.spyFullAllowed && this.game.playerData.identity === "spy"){
		    nominatePlayersContent+=getNominatePlayerItem({"name":"<b>Everyone here is a spy!</b>","id":""},"");
        }
		this.inGamePlayers.innerHTML = inGamePlayerContent;
        this.nominatePlayers.innerHTML = nominatePlayersContent;

        this.numPlayers = this.game.players.length;
    }

    update(game,room){
        this.game = game;
        this.room = room;
        if(this.shouldInitialize){
            this.shouldInitialize = false;
            this.initialize();
        }
        if(globals.debug){
            console.log("Updating Game: ", game);
        }





        if(game.scene === "default"){

        }
        else if(game.scene === "vote"){
            this.nominating = false;
            this.guessingLocation = false;
            document.getElementById("vote_endGame").style.display = (game.playerData.id === room.adminId)?"block":"none";

            let allowedToVote = true;
            for(let p = 0; p< game.votingData.finishedVoting.length; p++){
                if(game.votingData.finishedVoting[p].id === game.playerData.id){
                    allowedToVote = false;
                }
            }

            if(allowedToVote){

                document.getElementById("vote_playerName").innerHTML = "Is " + game.votingData.nomineeName + " a spy?";
                document.getElementById("vote_buttons").style.display = "block";
            }
            else{
                let str = "Waiting for "+ game.votingData.numLeftToVote + " player";
                str += ((game.votingData.numLeftToVote !== 1)?"s":"") + " to finish voting...";
                document.getElementById("vote_playerName").innerHTML = str;
                document.getElementById("vote_buttons").style.display = "none";
            }
            this.allowedToVote = allowedToVote;


        }
        else if(game.scene === "results"){
            this.nominating = false;
            this.guessingLocation = false;
            this.results = game.results;

            document.getElementById("gameOverReason").innerHTML = game.gameOverReason.description;

            document.getElementById("resultsPlayers").innerHTML = "";
            for(let p = 0; p < game.results.length; p++){
                document.getElementById("resultsPlayers").innerHTML+=getResultsPlayerItem(game.results[p]);
            }


        }



        if(this.numPlayers !== this.game.players.length){
            this.updatePlayerLists();
        }



        document.getElementById("scene_guessLocation").style.display = (!this.nominating &&this.guessingLocation && game.scene === "default")?"flex":"none";
        document.getElementById("scene_nominate").style.display = (this.nominating && game.scene === "default")?"flex":"none";
        document.getElementById("scene_default").style.display = (!this.nominating && !this.guessingLocation && game.scene === "default")?"flex":"none";
        document.getElementById("scene_vote").style.display = (game.scene === "vote" && this.identity !== "spectator")?"flex":"none";
        document.getElementById("scene_results").style.display = (game.scene === "results")?"flex":"none";


    }
    showGuessLocationScreen(){
        if(this.game.playerData.identity === "spy"){
            this.guessingLocation = true;
            this.nominating = false;
            this.update(this.game,this.room);
        }
    }
    hideGuessLocationScreen(){
        this.guessingLocation = false;
        this.update(this.game,this.room);
    }
    guessLocation(locationName){
        if(this.game.playerData.identity === "spy"){
            globals.socket.emit('gameInteraction',{"type":"guessLocation","locationName":locationName});
        }
    }

    showNominationScreen(){
        if(this.game.playerData.canNominate){
            this.nominating = true;
            this.guessingLocation = false;
            this.update(this.game,this.room);

        }

    }
    hideNominationScreen(){
        this.nominating = false;
        document.getElementById("scene_nominate").style.display = "none";
        document.getElementById("scene_default").style.display = "block";
        this.update(this.game,this.room);
    }

    vote(guilty){
        if(!this.allowedToVote){
            return;
        }
         globals.socket.emit('gameInteraction',{"type":"vote","guilty":guilty});
    }
    nominate(id){
        console.log(id);
        if(!this.game.playerData.canNominate){
            return;
        }
        if(id.length === 0){
            globals.socket.emit('gameInteraction',{"type":"nomination","nominateEveryone":true});
            return;
        }
        globals.socket.emit('gameInteraction',{"type":"nomination","nominateEveryone":false,"nomineeId":id})

    }
    toggleStrike(e){
        //probably don't let the player strike themself?
        if(e.id.substring(2) === globals.playerId){
            return;
        }

        e.classList.toggle("striked");
    }


    static toggleLocationInfo(){
        if(document.getElementById("locationToggleText").innerHTML === "hide"){
            document.getElementById("sensitiveInfo").style.display = "none";
            document.getElementById("locationToggleText").innerHTML ="show";
        }
        else{
            document.getElementById("sensitiveInfo").style.display = "block";
            document.getElementById("locationToggleText").innerHTML = "hide";
        }
    }
    static readGameOptions(){
        let playWithSpyFull = document.getElementById("playWithSpyFull").checked;
        return {"playWithSpyFull":playWithSpyFull}
    }
    static getGameOptionsHTML(){
        return`<input type="checkbox" id="playWithSpyFull" class="gameOptionsCheckbox" name="playWithSpyFull" checked><div for="playWithSpyFull" class="gameOptionsLabel">Play with a chance of all players being spies(SpyFull)?</div></br></br>`
    }




}

function getResultsPlayerItem(player){
    return '<li class="player-name">' + player.name + " : " + ((player.identity === "spy")?"spy":player.role) +'</li>'
}
// function getIGPlayerItem(plr,first){
//
// 	if(plr.id === first){
// 		return '<li class="player-name" onclick="strike(this)">'+plr.name+'<a class="firstPlayer">1st</a></li>'
//
// 	}
// 	else{
// 		return '<li class="player-name" onclick="strike(this)">'+plr.name+'</li>'
//
// 	}
// }

function getIGPlayerItem(plr,firstPlayerId){

    if(plr.id === firstPlayerId){

        return `<div class="player-name spyFallPlayerName" id="ig_${plr.id}" style="color:#${plr.id}" onClick="globals.game.toggleStrike(this)"><p class="player-name-text">${plr.name}</p><div class="firstPlayer">1st</div></div>`
    }

    return `<div class="player-name spyFallPlayerName" id="ig_${plr.id}" style="color:#${plr.id}" onClick="globals.game.toggleStrike(this)"><p class="player-name-text">${plr.name}</p></div>`

}


function getNominatePlayerItem(player,playerId){
    // console.log(player,first);
	if(player.id !== playerId || playerId.length === 0){
		return '<li class="player-name" onclick="globals.game.nominate(`' + player.id +'`)">'+player.name+'</li>'
	}
	return ``;

}

let spyFallHTML =
    `<div id="sceneContainer" class="flexColumn fullHeight fullWidth">
        <div id="scene_default" class="flexColumn fullHeight fullWidth" style="">
			<div id="locationText" class="locationClass">
				<a class="locationDisplayToggle" onclick="SpyFall.toggleLocationInfo()"><i id="locationToggleText">hide</i></a>
				<div id="sensitiveInfo">
					<h2 id="location"> Location: place</h2>
					<h2 id="role"> Role : job </h2>
				</div>
			</div>

			<h3>Players</h3>
                <div id="inGamePlayers" class="playerList flexColumn fullWidth">
                
                </div>
                    

<!--			<div class="ingameplayerListContainer" >-->
<!--				<ul id="ingamePlayers" class="ingame-player-list">-->
<!--				</ul>-->
<!--				</br>-->
<!--			</div>-->

			</br>

			<button id="endGame" class="smallerIntroButton" onclick="endGame()" style="display:none;">End The Game</button>
			<button id="showNominationScreen" class="smallerIntroButton" onclick="globals.game.showNominationScreen()">Vote For the Spy</button>
			<button id="showGuessLocationScreen" class="smallerIntroButton" onclick="globals.game.showGuessLocationScreen()" style="display:none;">Guess the Location</button>

			<button id="leaveRoom" class="smallerIntroButton" onclick="leaveRoom()">Leave The Room</button>

			</br>

			<h3><u> Location List</u></h3>

			<ul id="locationRefList" class="locationRefList" style="display:none;">
				<li class="locationReference" onclick="strikeRef(this)">airplane</li>
				<li class="locationReference" onclick="strikeRef(this)">bank</li>
				<li class="locationReference" onclick="strikeRef(this)">beach</li>
				<li class="locationReference" onclick="strikeRef(this)">cathedral</li>
				<li class="locationReference" onclick="strikeRef(this)">circus tent</li>
				<li class="locationReference" onclick="strikeRef(this)">corporate party</li>
				<li class="locationReference" onclick="strikeRef(this)">crusader army</li>
				<li class="locationReference" onclick="strikeRef(this)">casino</li>
				<li class="locationReference" onclick="strikeRef(this)">day spa</li>
				<li class="locationReference" onclick="strikeRef(this)">embassy</li>
				<li class="locationReference" onclick="strikeRef(this)">hospital</li>
				<li class="locationReference" onclick="strikeRef(this)">hotel</li>
				<li class="locationReference" onclick="strikeRef(this)">military base</li>
				<li class="locationReference" onclick="strikeRef(this)">movie studio</li>
			</ul>
			<ul id="locationRefList2" class="locationRefList" style="display:none;">
				<li class="locationReference" onclick="strikeRef(this)">ocean liner</li>
				<li class="locationReference" onclick="strikeRef(this)">passenger train</li>
				<li class="locationReference" onclick="strikeRef(this)">pirate ship</li>
				<li class="locationReference" onclick="strikeRef(this)">polar station</li>
				<li class="locationReference" onclick="strikeRef(this)">police station</li>
				<li class="locationReference" onclick="strikeRef(this)">restaurant</li>
				<li class="locationReference" onclick="strikeRef(this)">school</li>
				<li class="locationReference" onclick="strikeRef(this)">service station</li>
				<li class="locationReference" onclick="strikeRef(this)">space station</li>
				<li class="locationReference" onclick="strikeRef(this)">submarine</li>
				<li class="locationReference" onclick="strikeRef(this)">supermarket</li>
				<li class="locationReference" onclick="strikeRef(this)">theater</li>
				<li class="locationReference" onclick="strikeRef(this)">university</li>
				<li class="locationReference" onclick="strikeRef(this)">world war ii squad</li>
			</ul>
		</div>
		<div id="scene_nominate" class="flexColumn fullHeight fullWidth" style="display:none;">
            <h2>Nominate a player as the spy, and commence a group vote</h2>
            <h3>Each player can only do this once per game, once they are all used up, the spy wins</h3>
            <h3>The vote must be unanimous(excluding the player who is nominated)</h3>
            <button id="hideNominationScreen" class="smallerIntroButton" onclick="globals.game.hideNominationScreen()">Go back</button>
            <div class="ingameplayerListContainer" >
                <ul id="nominatePlayers" class="ingame-player-list">
                </ul>
            </div>
        </div>
        <div id="scene_guessLocation" class="flexColumn fullHeight fullWidth" style="display:none;">
            <h2>Guess the Location</h2>
            <h3>Wrong guess and you lose</h3>
            
			<button id="hideGuessLocationScreen" class="smallerIntroButton" onclick="globals.game.hideGuessLocationScreen()" >Go back</button>
            <ul id="locationRefList" class="locationRefList">
				<li class="locationReference" onclick="globals.game.guessLocation('airplane')">airplane</li>
				<li class="locationReference" onclick="globals.game.guessLocation('bank')">bank</li>
				<li class="locationReference" onclick="globals.game.guessLocation('beach')">beach</li>
				<li class="locationReference" onclick="globals.game.guessLocation('cathedral')">cathedral</li>
				<li class="locationReference" onclick="globals.game.guessLocation('circus tent')">circus tent</li>
				<li class="locationReference" onclick="globals.game.guessLocation('corporate party')">corporate party</li>
				<li class="locationReference" onclick="globals.game.guessLocation('crusader army')">crusader army</li>
				<li class="locationReference" onclick="globals.game.guessLocation('casino')">casino</li>
				<li class="locationReference" onclick="globals.game.guessLocation('day spa')">day spa</li>
				<li class="locationReference" onclick="globals.game.guessLocation('embassy')">embassy</li>
				<li class="locationReference" onclick="globals.game.guessLocation('hospital')">hospital</li>
				<li class="locationReference" onclick="globals.game.guessLocation('hotel')">hotel</li>
				<li class="locationReference" onclick="globals.game.guessLocation('military base')">military base</li>
				<li class="locationReference" onclick="globals.game.guessLocation('movie studio')">movie studio</li>
			</ul>
			<ul id="locationRefList2" class="locationRefList">
				<li class="locationReference" onclick="globals.game.guessLocation('ocean liner')">ocean liner</li>
				<li class="locationReference" onclick="globals.game.guessLocation('passenger train')">passenger train</li>
				<li class="locationReference" onclick="globals.game.guessLocation('pirate ship')">pirate ship</li>
				<li class="locationReference" onclick="globals.game.guessLocation('polar station')">polar station</li>
				<li class="locationReference" onclick="globals.game.guessLocation('police station')">police station</li>
				<li class="locationReference" onclick="globals.game.guessLocation('restaurant')">restaurant</li>
				<li class="locationReference" onclick="globals.game.guessLocation('school')">school</li>
				<li class="locationReference" onclick="globals.game.guessLocation('service station')">service station</li>
				<li class="locationReference" onclick="globals.game.guessLocation('space station')">space station</li>
				<li class="locationReference" onclick="globals.game.guessLocation('submarine')">submarine</li>
				<li class="locationReference" onclick="globals.game.guessLocation('supermarket')">supermarket</li>
				<li class="locationReference" onclick="globals.game.guessLocation('theater')">theater</li>
				<li class="locationReference" onclick="globals.game.guessLocation('university')">university</li>
				<li class="locationReference" onclick="globals.game.guessLocation('world war ii squad')">world war ii squad</li>
			</ul>
            
        </div>
        <div id="scene_vote" class="flexColumn fullHeight fullWidth" style="display:none;">
            <h1 id="vote_playerName">Is Player a spy?</h1>
            <div id="vote_buttons" style="display:none;">
                <button id="voteGuilty" class="smallerIntroButton" onclick="globals.game.vote(true)">Yes</button>
                <button id="voteInnocent" class="smallerIntroButton" onclick="globals.game.vote(false)">No</button>
            </div>
            <button id="vote_endGame" class="smallerIntroButton" onclick="endGame()" style="display:none;">End The Game</button>
			<button id="vote_leaveRoom" class="smallerIntroButton" onclick="leaveRoom()">Leave The Room</button>

        </div>
        <div id="scene_results" class="flexColumn fullHeight fullWidth" style="display:none;">
            <h1>Results Screen</h1>
            <h3 id="gameOverReason"></h3>
            <ul id="resultsPlayers" class="lobby-player-list">
               
                
            </ul>
        </div>
        
    </div>`;


function strike(e){
	if(e.classList.contains("player-name-striked") ){
		e.classList.remove('player-name-striked');
		e.classList.add('player-name');
	}
	else{
		e.classList.remove('player-name');
		e.classList.add('player-name-striked');
	}
}
function strikeRef(e){
	if(e.classList.contains("locationReference-striked") ){
		e.classList.remove('locationReference-striked');
	}
	else{
		e.classList.add('locationReference-striked');
	}
}
