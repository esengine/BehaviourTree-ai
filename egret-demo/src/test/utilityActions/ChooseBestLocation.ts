class ChooseBestLocation implements IActionOptionAppraisal<UtilitySample, Locate>{

    /**
     * 行动评估将对提供最高分的位置进行评分，以便访问最佳位置
     */
    public getScore(context: UtilitySample, option: Locate): number{
        if (option == Locate.Home)
            return context.state.fatigue >= State.MAX_FATIGUE ? 20 : 0;

        if (option == Locate.Saloon)
            return context.state.thirst >= State.MAX_THIRST ? 15 : 0;

        if (option == Locate.Bank){
            if (context.state.gold >= State.MAX_GOLD)
                return 10;

            // 如果我们不在矿山，并且我们身上有足够的黄金，则先将其放入银行
            if (context.state.currentLocation != Locate.Mine){
                // 将我们当前的黄金价值标准化为0-1
                let gold = Mathf.map01(context.state.gold, 0, State.MAX_GOLD);
                let score = Math.pow(gold, 2);
                return score * 10;
            }

            return 0;
        }

        return 5;
    }
}