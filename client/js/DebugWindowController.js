class DebugWindowController{
    constructor(pageIdList){
        this.pages = pageIdList;

        document.addEventListener("keyup",(event)=>{
            if (event.key === "ArrowRight") {

                this.nextPage();
            }
            else if(event.key === "ArrowLeft") {
                this.prevPage();
            }
        });
        this.currentPage = 0;
        console.log(document.getElementById(this.pages[0].id))

        document.getElementById(this.pages[0].id).style.display = "flex";
    }
    findCurrentPage(){
        for(let p = 0; p< this.pages.length; p++){
            if(globals.page === this.pages[p].name){
                this.currentPage = p;
                return;
            }
        }
        console.log("Debug Window Controller: couldn't find the current page, setting page the first one provided");
        this.currentPage = 0;
    }
    nextPage(){
        this.findCurrentPage();
        if(this.currentPage + 1 < this.pages.length){
            this.hidePage(this.pages[this.currentPage]);
            this.currentPage++;
            this.showPage(this.pages[this.currentPage]);
        }
        else{
            console.log("That was the last page",this.currentPage)
            console.log(this.pages.length)
        }

    }
    prevPage(){
        this.findCurrentPage();
        if(this.currentPage > 0){
            this.hidePage(this.pages[this.currentPage]);
            this.currentPage--;
            this.showPage(this.pages[this.currentPage]);
        }
        else{
            console.log("That was the first page",this.currentPage)
        }
    }
    showPage(page){
        document.getElementById(page.id).style.display = "flex";
        globals.page = page.name
        if(globals.page === "lobby" || globals.page === "game"){
            document.getElementById("room_pages").style.display = "flex";
        }
    }
    hidePage(page){
        if(globals.page === "lobby" || globals.page === "game"){
            document.getElementById("room_pages").style.display = "none";
        }
        document.getElementById(page.id).style.display = "none";

    }

}
