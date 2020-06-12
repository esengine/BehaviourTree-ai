/**
 * 数组扩展器 
 * 模拟 Stack<T>.
 */
class ArrayExt{
    /**
     * 将数组打乱顺序
     */
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

    /**
     * 取出数组第一个项
     */
    public static peek<T>(list: Array<T>): T{
        return list[0];
    }

    /**
     * 向数组头部添加一个项
     */
    public static push<T>(list: Array<T>, item: T){
        list.splice(0, 0, item);
    }

    /**
     * 移除数组第一个项并返回它
     */
    public static pop<T>(list: Array<T>): T{
        return list.shift();
    }
}