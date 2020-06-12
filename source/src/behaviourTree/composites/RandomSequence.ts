///<reference path="./Sequence.ts"/>
/**
 * 与sequence相同，只是它在开始时对子级进行无序处理
 */
class RandomSequence<T> extends Sequence<T>{
    public onStart(){
        ArrayExt.shuffle(this._children);
    }
}