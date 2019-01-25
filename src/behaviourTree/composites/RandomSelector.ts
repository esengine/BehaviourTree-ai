class RandomSelector<T> extends Selector<T>{
    public onStart(){
        ArrayExt.shuffle(this._children);
    }
}