module utility{
    class LogAction<T> implements IAction<T>{
        private _text: string;

        constructor(text: string){
            this._text = text;
        }

        public execute(context: T){
            console.log(this._text);
        }
    }
}

