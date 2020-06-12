class Random{
    public static range(min: number, max: number): number{
        let seed = new Date().getTime();

        max = max || 1;
        min = min || 0;
        seed = (seed * 9301 + 49297) % 233280;
        let rnd = seed / 233280.0;
        return min + rnd * (max - min);
    }
}