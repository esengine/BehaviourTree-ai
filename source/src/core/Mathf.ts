module es {
    export class Mathf{
        /**
         * 将某个值从某个任意范围映射到0到1范围
         */
        public static map01(value: number, min: number, max: number): number{
            return (value - min) * 1 / (max - min);
        }
    
        /**
         * 以roundToNearest为步长，将值舍入到最接近的数字。例如：在125中找到127到最近的5个结果
         * @param value 
         * @param roundToNearest 
         */
        public static roundToNearest(value: number, roundToNearest: number){
            return Math.round(value / roundToNearest) * roundToNearest;
        }
    }
}
