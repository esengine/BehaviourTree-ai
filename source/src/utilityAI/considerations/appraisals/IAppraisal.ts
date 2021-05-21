module utilityAI {
    export interface IAppraisal<T>{
        getScore(context: T): number;
    }
}
