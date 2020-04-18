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
        this.voteBack = false;
        this.voteBackFor = undefined;
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
        if(this.voteBack && this.game.votingData.voteId !== this.voteBackFor){
            this.voteBack = false;
            this.voteBackFor = undefined;
        }

        if(game.scene === "default" || this.voteBack){

        }
        else if(game.scene === "vote"){
            this.hideModal();
            this.nominating = false;
            this.guessingLocation = false;

            let allowedToVote = true;
            for(let p = 0; p< game.votingData.finishedVoting.length; p++){
                if(game.votingData.finishedVoting[p].id === game.playerData.id){
                    allowedToVote = false;
                }
            }
            this.allowedToVote = allowedToVote;

            document.getElementById("vote_nominator").style.textDecorationColor = "#"+game.votingData.nominatorId;
            document.getElementById("vote_nominee").style.textDecorationColor = "#"+game.votingData.nomineeId;

            document.getElementById("vote_nominator").innerHTML = game.votingData.nominatorName;
            document.getElementById("vote_nominee").innerHTML = game.votingData.nomineeName;
            document.getElementById("vote_controls").style.display = (allowedToVote)?"flex":"none";
            document.getElementById("vote_info").style.display = (!allowedToVote)?"flex":"none";
            document.getElementById("vote_numLeftToVote").innerHTML = game.votingData.numLeftToVote;
            document.getElementById("vote_numLeftToVotePlural").innerHTML = (game.votingData.numLeftToVote !== 1)?"s":"";





        }
        else if(game.scene === "results"){

            this.results = game.results;

            document.getElementById("gameOverReason").innerHTML = game.gameOverReason.description;
            if(!game.gameOverReason.spyFullGame){
                document.getElementById("results_location").innerHTML = `Location: ${game.gameOverReason.location}`;

                for(let p = 0; p < game.results.length; p++){
                    if(game.results[p].identity === "spy"){
                        document.getElementById("results_spy").innerHTML = `Spy: <span class="player-name-text" style="text-decoration-color:#${game.results[p].id}">${game.results[p].name}`;
                        break;
                    }
                    // document.getElementById("resultsPlayers").innerHTML+=getResultsPlayerItem(game.results[p]);
                }
            }


            //document.getElementById("resultsPlayers").innerHTML = "";
            // for(let p = 0; p < game.results.length; p++){
            //     document.getElementById("resultsPlayers").innerHTML+=getResultsPlayerItem(game.results[p]);
            // }


        }



        if(this.numPlayers !== this.game.players.length){
            this.updatePlayerLists();
        }



        // document.getElementById("scene_guessLocation").style.display = (!this.nominating &&this.guessingLocation && game.scene === "default")?"flex":"none";
        document.getElementById("scene_default").style.display = (game.scene === "default" || this.voteBack)?"flex":"none";
        document.getElementById("scene_vote").style.display = (game.scene === "vote" && !this.voteBack)?"flex":"none";
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
        if(this.game.scene !== "default"){
            showPopUp("Wait for the vote to end");
            return;
        }
        if(this.game.playerData.identity === "spy"){
            // let location = element.id.substring(9);//"location_"
            let locationName = element.firstElementChild.innerHTML;
            if(confirm(`Really Pick ${locationName}? If it's wrong you lose.`)){
                globals.socket.emit('gameInteraction',{"type":"guessLocation","locationName":locationName});

            }
        }
    }
    goBackFromVote(){
        if(this.allowedToVote){
            return;
        }
        this.voteBack = true;
        this.voteBackFor = this.game.votingData.voteId;
        this.update(this.game,this.room);
    }

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
        if(this.game.scene !== "default"){
            showPopUp("Wait for the vote to end");
        }
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
               
            </div>

		</div>
		
        <div id="scene_vote" class="flexColumn fullHeight fullWidth" style="display:none;">
            <div class="lessVerticalPagePadding"></div>
            <h2 class="voteBy">Vote Called By <span id="vote_nominator" class="player-name-text"></span></h2>
            <div class="horizontalSeperator"></div>
            <div class="verticalPagePadding"></div>
            <h1 class="voteFor">Is <span id="vote_nominee" class="player-name-text"></span> A Spy?</h1>

            <div id="vote_controls" class="flexColumn fullWidth" style="display:none;">
                <div class="flexRowNoCenter threeQuarterWidth spaceAround">
                    <div id="voteGuilty" class="button verySmallButton voteButton" onclick="globals.game.vote(true)">Yes</div>
                    <div id="voteInnocent" class="button verySmallButton voteButton" onclick="globals.game.vote(false)">No</div>
                </div>
            </div>
            <div id="vote_info" class="flexColumn fullWidth" style="display:none;">
                <h1 class="waitingFor">Waiting For <span id="vote_numLeftToVote"></span> Player<span id="vote_numLeftToVotePlural"></span> To Vote</h1>
                <div class="lessVerticalPagePadding"></div>
                <div id="vote_backButton" class="button smallButton" onclick="globals.game.goBackFromVote()">Go Back</div>
            </div>


        </div>
        <div id="scene_results" class="flexColumn fullHeight fullWidth" style="display:none;">
            <div class="lessVerticalPagePadding"></div>
            <h1 class="resultsTitle">Results</h1>
            <div class="horizontalSeperator"></div>

            <h3 id="gameOverReason" class="gameOverReason"></h3>

            <h3 id="results_location" class="voteBy"></h3>
            <h3 id="results_spy" class="voteBy"></h3>

            
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
