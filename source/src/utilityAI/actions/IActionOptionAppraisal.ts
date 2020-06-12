interface IActionOptionAppraisal<T, U>{
    getScore(context: T, option: U): number;
}