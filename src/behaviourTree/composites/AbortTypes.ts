enum AbortTypes{
    None,
    LowerPriority,
    Self,
    Both = Self | LowerPriority
}

class AbortTypesExt{
    public static has(self: AbortTypes, check: AbortTypes){
        return ( self & check ) == check;
    }
}