class ArrayExt{
    public static shuffle<T>(list: Array<T>){
        let n = list.length - 1;
        while (n > 1){
            n --;
            let k = Random.range(0, n + 1);
            let value = list[k];
            list[k] = list[n];
            list[n] = value;
        }
    }

    public static peek<T>(list: Array<T>): T{
        return list[list.length - 1];
    }
}