class CreateRoom {

    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.gameSelection = undefined;
        this.gameSelectArrow = document.getElementById("gameSelectArrow");
        this.gameSelector = document.getElementById("gameSelection");
        this.gameSelectName = document.getElementById("gameSelectName");
        this.gameSelectOptions = document.getElementById("gamesSelectionOptions");
        this.roomNameInput = document.getElementById("roomNameInput");
    }

    readGameOptions(cb){
        let game;
        if(this.gameSelection === "SpyFall"){
            cb(SpyFall.readGameOptions());
        }
        else if(this.gameSelection === "MatchIt"){
            cb({},"this game is still a work in progress");
        }
        else{
            cb({},"Please select a game");
        }
    }

    newRoom(){
        let roomName = this.roomNameInput.value;
        if ( !(/\S/.test(roomName)) || roomName.length > 16) {
            alert("Please enter a valid name (less than 16 characters)");
            return false;
        }

        this.readGameOptions((options,err)=>{
            if(err){
                alert(err);
                return;
            }
            globals.socket.emit('newRoom',{"name":roomName,"gameOptions":options,"gameType":this.gameSelection});
            this.resetNewRoomMenuState();
        });
    }

    handleGameSelectMenu(){
        let hiddenState = this.gameSelector.classList.toggle("hideSelections");
        this.gameSelectArrow.classList.toggle("down",hiddenState);
        this.gameSelectArrow.classList.toggle("up",!hiddenState);

    }
    closeGameSelectMenu(){
        this.gameSelector.classList.toggle("hideSelections",true);
        this.gameSelectArrow.classList.toggle("down",true);
        this.gameSelectArrow.classList.toggle("up",false);
    }

    handleGameSelect(e){
        if(e.id === "selectSpyFall"){
            this.gameSelection ="SpyFall";
            this.gameSelectName.innerHTML = "SpyFall";
            this.gameSelectOptions.innerHTML = SpyFall.getGameOptionsHTML();
        }
        else if(e.id === "selectMatchIt"){
            this.gameSelection ="MatchIt";
            this.gameSelectName.innerHTML = "MatchIt";
            this.gameSelectOptions.innerHTML = "";
        }
        else{
            this.gameSelection = undefined;
            this.gameSelectName.innerHTML = "Choose a Game:";
            this.gameSelectOptions.innerHTML = "";
        }
    }

    //used after a new room is created
    resetNewRoomMenuState(){
        this.gameSelectOptions.innerHTML = "";
        this.roomNameInput.value = "";
        this.gameSelection = undefined;
        this.gameSelectName.innerHTML = "Choose a Game:";
    }


}
