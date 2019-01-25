class State{
    public static MAX_FATIGUE: number = 10;
    public static MAX_GOLD = 8;
    public static MAX_THIRST = 5;

    public fatigue: number = 0;
    public thirst: number = 0;
    public gold: number = 0;
    public goldInBank: number;
    public currentLocation: Locate = Locate.Home;
}

enum Locate{
    Home,
    InTransit,
    Mine,
    Saloon,
    Bank
}

