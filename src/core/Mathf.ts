class Mathf{
    /**
     * 将某个值从某个任意范围映射到0到1范围
     */
    public static map01(value: number, min: number, max: number): number{
        return (value - min) * 1 / (max - min);
    }
}