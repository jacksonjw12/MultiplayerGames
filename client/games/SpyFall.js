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

        this.nominatePlayers = document.getElementById("playerSelectionList");
        this.inGamePlayers = document.getElementById("inGamePlayers");
        this.playerSelector = document.getElementById("playerSelection");
        this.playerSelectArrow = document.getElementById("playerSelectArrow");
        this.playerSelectName = document.getElementById("playerSelectName");
    }
    initialize(){
        if(globals.debug){
            console.log("Initializing Game: ", this.game);
        }
        let controls = document.getElementById("spyFallActionsSecondRow");
        if(this.room.admin === this.game.playerData.id){
            // document.getElementById("endGame").style.display = "inline-block";
            controls.innerHTML = `<div id="spyFallEndGame" class="button verySmallButton" onclick="endGame()">End The Game</div>`;
        }
        else{
            controls.innerHTML = `<div id="spyFallLeaveRoom" class="button verySmallButton" onclick="leaveRoom()">Leave The Room</div>`;
        }
        this.identity = this.game.playerData.identity;
        this.role = this.game.playerData.role;
        this.location = this.game.location;

        document.getElementById("spyFallActionsFirstRow").style.display = "flex";
        document.getElementById("spyLocationPrompt1").style.display="none";
        document.getElementById("spyLocationPrompt2").style.display="none";
        document.getElementById("spyLocationPrompt3").style.display="none";
        document.getElementById("nominateDivider").style.display = "none";
        document.getElementById("selectAllSpies").style.display = "none";
        document.getElementById("showLocationScreenFromNomination").style.display = "none";

        if(this.identity === "innocent"){
            document.getElementById("spyFallLocation").innerHTML = this.location;
            document.getElementById("spyFallRole").innerHTML = this.role;
            document.getElementById("spyFallGameLocationContainer").style.display = "flex";
            document.getElementById("spyFallRoleContainer").style.display = "flex";
            document.getElementById("spyFallGoal").innerHTML = "Find the Spy to Win"
            document.getElementById("locationsTitle").style.display="flex";

        }
        else if(this.identity === "spy"){
            document.getElementById("spyFallIdentity").innerHTML = "You are a Spy";
            document.getElementById("spyFallIdentity").style.display="flex";
            document.getElementById("spyFallGoal").innerHTML = "Figure out the Location to Win"
            document.getElementById("locationsTitle").style.display="none";
            document.getElementById("spyLocationPrompt1").style.display="flex";
            document.getElementById("spyLocationPrompt2").style.display="flex";
            document.getElementById("showLocationScreenFromNomination").style.display = "block";

            if(this.game.spyFullAllowed){
                document.getElementById("spyLocationPrompt3").style.display="flex";
                document.getElementById("nominateDivider").style.display = "flex";
                document.getElementById("selectAllSpies").style.display = "flex";
            }

            // document.getElementById("showGuessLocationScreen").style.display = "inline-block";

        }
        else{//spectator
            document.getElementById("spyFallActionsFirstRow").style.display = "none";
            document.getElementById("spyFallIdentity").innerHTML = "You are a spectator";
            document.getElementById("spyFallGoal").style.display = "none";
            document.getElementById("spyFallIdentity").style.display="flex";
        }

        this.updatePlayerLists();
        this.showGameLocation();

    }
    updatePlayerLists(){
        let inGamePlayerContent = '';
        let nominatePlayersContent = '';

		for(let p = 0; p < this.game.players.length; p++){
			inGamePlayerContent+=getIGPlayerItem(this.game.players[p],this.game.firstPlayerId);
            nominatePlayersContent+=getNominatePlayerItem(this.game.players[p],this.game.playerData.id);
		}
		// if(this.game.spyFullAllowed && this.game.playerData.identity === "spy"){
		//     nominatePlayersContent+=getNominatePlayerItem({"name":"<b>Everyone here is a spy!</b>","id":""},"");
        // }
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


        if(!this.game.playerData.canNominate){
            document.getElementById("showNominationScreen").style.display = "none";
        }


        if(game.scene === "default"){

        }
        else if(game.scene === "vote"){
            this.hideModal();
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



        // document.getElementById("scene_guessLocation").style.display = (!this.nominating &&this.guessingLocation && game.scene === "default")?"flex":"none";
        document.getElementById("scene_default").style.display = (!this.nominating && !this.guessingLocation && game.scene === "default")?"flex":"none";
        document.getElementById("scene_vote").style.display = (game.scene === "vote" && this.identity !== "spectator")?"flex":"none";
        document.getElementById("scene_results").style.display = (game.scene === "results")?"flex":"none";


    }
    // showGuessLocationScreen(){
    //     if(this.game.playerData.identity === "spy"){
    //         this.guessingLocation = true;
    //         this.nominating = false;
    //         this.update(this.game,this.room);
    //     }
    // }
    // hideGuessLocationScreen(){
    //     this.guessingLocation = false;
    //     this.update(this.game,this.room);
    // }
    guessLocation(element){
        if(this.game.playerData.identity === "spy"){
            // let location = element.id.substring(9);//"location_"
            let locationName = element.firstElementChild.innerHTML;
            if(confirm(`Really Pick ${locationName}? If it's wrong you lose.`)){
                globals.socket.emit('gameInteraction',{"type":"guessLocation","locationName":locationName});

            }
        }
    }

    // showNominationScreen(){
    //     if(this.game.playerData.canNominate){
    //         this.nominating = true;
    //         this.guessingLocation = false;
    //         this.update(this.game,this.room);
    //
    //     }
    //
    // }
    // hideNominationScreen(){
    //     this.nominating = false;
    //     document.getElementById("scene_nominate").style.display = "none";
    //     document.getElementById("scene_default").style.display = "block";
    //     this.update(this.game,this.room);
    // }

    vote(guilty){
        if(!this.allowedToVote){
            return;
        }
         globals.socket.emit('gameInteraction',{"type":"vote","guilty":guilty});
    }

    toggleStrike(e){
        //probably don't let the player strike themself?
        //format of ids is ig_{player.id}
        if(e.id.substring(3) === globals.playerId){

            return;
        }

        e.classList.toggle("striked");
    }

    hideModal(){
        document.getElementById("spyFallModal").style.display = "none";
        this.toggleModalContents();
    }
    toggleModalContents(modalType){
        document.getElementById("spyFallGameLocationModal").style.display = (modalType==="gameLocation")?"flex":"none";
        document.getElementById("spyFallLocationsModal").style.display = (modalType==="locations")?"flex":"none";
        document.getElementById("spyFallNominationsModal").style.display = (modalType==="nominations")?"flex":"none";

    }

    showGameLocation(){
        this.toggleModalContents("gameLocation");
        document.getElementById("spyFallModal").style.display = "flex";
    }
    showLocations(){
        this.toggleModalContents("locations");
        document.getElementById("spyFallModal").style.display = "flex";
    }
    showNominations(){
        this.toggleModalContents("nominations");
        document.getElementById("spyFallModal").style.display = "flex";
    }

    togglePlayerSelectMenu(){

        let hiddenState = this.playerSelector.classList.toggle("hideSelections");
        // console.log(this.playerSelector.classList,this.playerSelector)
        this.playerSelectArrow.classList.toggle("down",hiddenState);
        this.playerSelectArrow.classList.toggle("up",!hiddenState);

    }
    closePlayerSelectMenu(){
        this.playerSelector.classList.toggle("hideSelections",true);
        this.playerSelectArrow.classList.toggle("down",true);
        this.playerSelectArrow.classList.toggle("up",false);
    }
    nominate(e){
        e = (e !== undefined)?e:{"innerHTML":"Nominate a Player:",id:""};

        let id = e.id.substring(3);//np_id
        if(globals.debug){
            console.log("Nominating player: " + e.id);
        }
        if(!this.game.playerData.canNominate){
            showPopUp("You cannot nominate another player");
            return;
        }
        this.playerSelectName.innerHTML = e.innerHTML;
        if(id.length === 0){
            globals.socket.emit('gameInteraction',{"type":"nomination","nominateEveryone":true});
            return;
        }
        globals.socket.emit('gameInteraction',{"type":"nomination","nominateEveryone":false,"nomineeId":id})

        this.hideModal();


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

        return `<div class="player-name spyFallPlayerName unselectable" id="ig_${plr.id}" style="color:#${plr.id}" onClick="globals.game.toggleStrike(this)"><p class="player-name-text">${plr.name}</p><div class="firstPlayer">1st</div></div>`
    }

    return `<div class="player-name spyFallPlayerName unselectable" id="ig_${plr.id}" style="color:#${plr.id}" onClick="globals.game.toggleStrike(this)"><p class="player-name-text">${plr.name}</p></div>`

}


function getNominatePlayerItem(player,playerId){
    // console.log(player,first);
	if(player.id !== playerId || playerId.length === 0){
	    return `<div class="playerSelectOption" id="np_${player.id}" onclick="globals.game.nominate(this)"><p>${player.name}</p></div>`
	}
	return ``;

}

let spyFallHTML =
    `<div id="sceneContainer" class="flexColumn fullHeight fullWidth">
        <div id="scene_default" class="flexColumn fullHeight fullWidth spaceEvenly" style="">
			<div class="button verySmallButton" onclick="globals.game.showGameLocation()">Re-Show Location</div>

			<h3 class="subTitle roomTitle"><u>Players</u></h3>
            <div id="inGamePlayers" class="playerList flexColumn fullWidth">
            
            </div>
                    

            <div id="spyFallActionsFirstRow" class="flexRow middleZIndex">
                <div id="showNominationScreen" class="button verySmallButton" onclick="globals.game.showNominations()">Vote For the Spy</div>
			    <div id="showLocationScreen" class="button verySmallButton" onclick="globals.game.showLocations()">Show Locations</div>
            </div>
             <div id="spyFallActionsSecondRow" class="flexRow middleZIndex">

            </div>

            <div id="spyFallModal" class="modalOverlay flexColumn fullWidth spaceAround higherZIndex" onclick="globals.game.hideModal();" style="display:none;">
                <div id="spyFallGameLocationModal" class="modalContentContainer flexColumn" style="display:none;" onclick="event.stopPropagation();">
                    <div id="spyFallGameLocationContainer" class="flexRow" style="display:none;">
                        <h2 class="noPadding">Location :&nbsp;</h2>
                        <h2 class="noPadding" id="spyFallLocation">location</h2>
                    </div>
                    <div id="spyFallRoleContainer" class="flexRow" style="display:none;">
                        <h2 class="noPadding">Role :&nbsp;</h2>
                        <h2 class="noPadding" id="spyFallRole">job</h2>
                    </div>
                    
                    <h2 id="spyFallIdentity" style="display:none;"></h2>
                    
                    
                    <h4 id="spyFallGoal">Find the Spy to Win</h4>
                    <div class="button verySmallButtonNoWidth" onclick="globals.game.hideModal();">Got it</div>
                </div>
                <div id="spyFallLocationsModal" class="modalContentContainer flexColumn" style="display:none;" onclick="event.stopPropagation();">
                    <h2 id="locationsTitle" class="locationsPrompt">Locations</h2>

                    <h2 id="spyLocationPrompt1" class="locationsPrompt" style="display:none;">Guess the Location</h2>
                    <h3 id="spyLocationPrompt2" class="locationsPrompt" style="display:none;">Wrong guess and you lose</h3>
                    <div id="locationsContainer" class="locationsContainer spyClickable">
                        <div class="locationName spyFallPlayerName unselectable" id="location_airplane" onclick="globals.game.guessLocation(this)"><p class="locationName-text">Airplane</p></div>
                        <div class="locationName spyFallPlayerName unselectable" id="location_bank" onclick="globals.game.guessLocation(this)"><p class="locationName-text">Bank</p></div>                      
                        <div class="locationName spyFallPlayerName unselectable" id="location_beach" onclick="globals.game.guessLocation(this)"><p class="locationName-text">Beach</p></div>
                        <div class="locationName spyFallPlayerName unselectable" id="location_cathedral" onclick="globals.game.guessLocation(this)"><p class="locationName-text">Cathedral</p></div>
                        <div class="locationName spyFallPlayerName unselectable" id="location_circusTent" onclick="globals.game.guessLocation(this)"><p class="locationName-text">Circus Tent</p></div>
                        <div class="locationName spyFallPlayerName unselectable" id="location_corporateParty" onclick="globals.game.guessLocation(this)"><p class="locationName-text">Corporate Party</p></div>
                        <div class="locationName spyFallPlayerName unselectable" id="location_crusaderArmy" onclick="globals.game.guessLocation(this)"><p class="locationName-text">Crusader Army</p></div>
                        <div class="locationName spyFallPlayerName unselectable" id="location_casino" onclick="globals.game.guessLocation(this)"><p class="locationName-text">Casino</p></div>
                        <div class="locationName spyFallPlayerName unselectable" id="location_daySpa" onclick="globals.game.guessLocation(this)"><p class="locationName-text">Day Spa</p></div>
                        <div class="locationName spyFallPlayerName unselectable" id="location_embassy" onclick="globals.game.guessLocation(this)"><p class="locationName-text">Embassy</p></div>
                        <div class="locationName spyFallPlayerName unselectable" id="location_hospital" onclick="globals.game.guessLocation(this)"><p class="locationName-text">Hospital</p></div>
                        <div class="locationName spyFallPlayerName unselectable" id="location_hotel" onclick="globals.game.guessLocation(this)"><p class="locationName-text">Hotel</p></div>
                        <div class="locationName spyFallPlayerName unselectable" id="location_militaryBase" onclick="globals.game.guessLocation(this)"><p class="locationName-text">Military Base</p></div>
                        <div class="locationName spyFallPlayerName unselectable" id="location_movieStudio" onclick="globals.game.guessLocation(this)"><p class="locationName-text">Movie Studio</p></div>
                        <div class="locationName spyFallPlayerName unselectable" id="location_oceanLiner" onclick="globals.game.guessLocation(this)"><p class="locationName-text">Ocean Liner</p></div>
                        <div class="locationName spyFallPlayerName unselectable" id="location_passengerTrain" onclick="globals.game.guessLocation(this)"><p class="locationName-text">Passenger Train</p></div>
                        <div class="locationName spyFallPlayerName unselectable" id="location_pirateShip" onclick="globals.game.guessLocation(this)"><p class="locationName-text">Pirate Ship</p></div>
                        <div class="locationName spyFallPlayerName unselectable" id="location_polarStation" onclick="globals.game.guessLocation(this)"><p class="locationName-text">Polar Station</p></div>
                        <div class="locationName spyFallPlayerName unselectable" id="location_policeStation" onclick="globals.game.guessLocation(this)"><p class="locationName-text">Police Station</p></div>
                        <div class="locationName spyFallPlayerName unselectable" id="location_restaurant" onclick="globals.game.guessLocation(this)"><p class="locationName-text">Restaurant</p></div>
                        <div class="locationName spyFallPlayerName unselectable" id="location_school" onclick="globals.game.guessLocation(this)"><p class="locationName-text">School</p></div>
                        <div class="locationName spyFallPlayerName unselectable" id="location_serviceStation" onclick="globals.game.guessLocation(this)"><p class="locationName-text">Service Station</p></div>
                        <div class="locationName spyFallPlayerName unselectable" id="location_spaceStation" onclick="globals.game.guessLocation(this)"><p class="locationName-text">Space Station</p></div>
                        <div class="locationName spyFallPlayerName unselectable" id="location_submarine" onclick="globals.game.guessLocation(this)"><p class="locationName-text">Submarine</p></div>
                        <div class="locationName spyFallPlayerName unselectable" id="location_supermarket" onclick="globals.game.guessLocation(this)"><p class="locationName-text">Supermarket</p></div>
                        <div class="locationName spyFallPlayerName unselectable" id="location_theater" onclick="globals.game.guessLocation(this)"><p class="locationName-text">Theater</p></div>
                        <div class="locationName spyFallPlayerName unselectable" id="location_university" onclick="globals.game.guessLocation(this)"><p class="locationName-text">University</p></div>
                        <div class="locationName spyFallPlayerName unselectable" id="location_worldWar2Squad" onclick="globals.game.guessLocation(this)"><p class="locationName-text">World War 2 Squad</p></div>
                        
                    </div>
                   
                   
                        
                    <div id="hideLocationsScreen" class="button verySmallButton" onclick="globals.game.hideModal()">Go back</div>
                    <h5 id="spyLocationPrompt3" class="locationsPrompt" style="display:none;">Hint: Remember there is a chance all players are spies.</h5>
    
                </div>
                
                <div id="spyFallNominationsModal" class="nominateModalContentContainer flexColumn" style="display:none;" onclick="event.stopPropagation();globals.game.closePlayerSelectMenu();">
                    <div class="nominateModal">
                        <div id="playerSelection" class="playerSelect hideSelections" onclick="event.stopPropagation();globals.game.togglePlayerSelectMenu()">

                            <div class="playerSelectButton unselectable"><div class="playerSelectButtonText"><h3 id="playerSelectName">Nominate a Player:</h3></div><div class="playerSelectButtonIconContainer"><i id="playerSelectArrow" class="arrow down"></i></div></div>
                            <div id="playerSelectionList" class="spyFallPlayerSelectionList">
<!--                                <div class="playerSelectOption" id="selectPlayer1" onclick="globals.game.nominate(this)"><p>Player 1</p></div>-->
<!--                                <div class="playerSelectOption" id="selectPlayer2" onclick="globals.game.nominate(this)"><p>Player 2</p></div>-->
<!--                            -->
                            </div>
                        </div>
                        <div id="nominateDivider" class="nominateDivider" style="display:none;"><p class="nominateDividerText">or</p></div>
                        <div id="selectAllSpies" style="display:none;" class="button verySmallButton" onclick="globals.game.nominate()">Everyone is a Spy!</div>

                    
                    </div>
                    <div class="flexRow nominateActions">
                        <div id="hideNominationScreen" class="button verySmallButton" onclick="globals.game.hideModal()">Go back</div>
                        <div id="showLocationScreenFromNomination" style="display:none;" class="button verySmallButton" onclick="globals.game.showLocations()">Guess Location</div>
                    </div>

                </div>
                <!--<div id="oldSpyFallNominationsModal" class="modalContentContainer nominateModal" style="display:none;">
                    <h2>Nominate a player as the spy, and commence a group vote</h2>
                    <h3>Each player can only do this once per game, once they are all used up, the spy wins</h3>
                    <h3>The vote must be unanimous(excluding the player who is nominated)</h3>
                    <div class="ingameplayerListContainer" >
                        <ul id="nominatePlayers" class="ingame-player-list">
                        </ul>
                    </div>
                    <div id="hideNominationScreen" class="smallerIntroButton" onclick="globals.game.hideModal()">Go back</div>

                </div>-->
            </div>
			
            
    <!--<h3><u> Location List</u></h3>-->

			
		</div>
		
        <!--<div id="scene_guessLocation" class="flexColumn fullHeight fullWidth" style="display:none;">
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
            
        </div>-->
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
