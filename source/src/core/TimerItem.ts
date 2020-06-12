class TimerItem{
    public delay: number = 0;
    public repeat: number = 0;
    public counter: number = 0;
    public thisObj: any;
    public callback: Function;
    public param: any;

    public hasParam: boolean;
    public end: boolean;


    public constructor(){}

    public advance(elapsed: number = 0): boolean{
        this.counter += elapsed;
        if (this.counter >= this.delay){
            this.counter -= this.delay;
            if (this.counter > this.delay)
                this.counter = this.delay;

            if (this.repeat > 0){
                this.repeat --;

                if (this.repeat == 0)
                    this.end = true;
            }

            return true;
        }
        else
            return false;
    }

    public reset(){
        this.callback = null;
        this.thisObj = null;
        this.param = null;
    }
}