module behaviourTree {
    export abstract class Decorator<T> extends Behavior<T>{
        public child!: Behavior<T>;
    
        public invalidate(){
            super.invalidate();
            this.child.invalidate();
        }
    }
}
