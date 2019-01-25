class RandomSequence<T> extends Sequence<T>{
    public onStart(){
        ArrayExt.shuffle(this._children);
    }
}