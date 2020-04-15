class DebugGameController{
    constructor(sceneIdList,game){
        this.scenes = sceneIdList;
        this.game = game;
        document.addEventListener("keyup",(event)=>{
            if (event.key === "ArrowUp" && globals.page==="game") {
                console.log("Advancing Game Scene")
                this.nextScene();
            }
            else if(event.key === "ArrowDown" && globals.page==="game") {
                this.prevScene();
            }
        });
        this.currentScene = 0;
        // console.log(document.getElementById(this.scenes[0].id))

        // document.getElementById(this.scenes[0].id).style.display = "flex";
    }
    findCurrentScene(){
        for(let p = 0; p< this.scenes.length; p++){
            if(this.game.game.scene === this.scenes[p].name){
                this.currentScene = p;
                return;
            }
        }
        console.log("Debug Game Controller: couldn't find the current scene, setting scene to the first one provided");
        this.currentScene = 0;
    }
    nextScene(){
        // this.findCurrentScene();
        if(this.currentScene + 1 < this.scenes.length){
            this.hideScene(this.scenes[this.currentScene]);
            this.currentScene++;
            this.showScene(this.scenes[this.currentScene]);
        }
        else{
            console.log("That was the last page",this.currentScene)
            console.log(this.scenes.length)
        }

    }
    prevScene(){
        // this.findCurrentScene();
        if(this.currentScene > 0){
            this.hideScene(this.scenes[this.currentScene]);
            this.currentScene--;
            this.showScene(this.scenes[this.currentScene]);
        }
        else{
            console.log("That was the first page",this.currentScene)
        }
    }
    showScene(scene){
        document.getElementById(scene.id).style.display = "flex";
        // this.game.game.scene = scene.name;
        // this.game.update(this.game.game,this.game.room);
    }
    hideScene(scene){

        document.getElementById(scene.id).style.display = "none";

    }


}



