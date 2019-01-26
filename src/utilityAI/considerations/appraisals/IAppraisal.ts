interface IAppraisal<T>{
    getScore(context: T): number;
}