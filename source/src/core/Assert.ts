class Assert{

    public static fail(message?: string, ...args: object[]){
        if (message)
            console.assert(false, message, args);
        else
            console.assert(false);
    }

    public static isTrue(condition: boolean, message?: string, ...args: object[]){
        if (!condition){
            if (message)
                Assert.fail(message, args);
            else
                Assert.fail();
        }
    }

    public static isNotNull(obj: object, message: string, ...args: object[]){
        Assert.isTrue(obj != null, message, args);
    }

    public static isFalse(condition: boolean, message?: string, ...args: object[]){
        if (message)
            this.isTrue(!condition, message, args);
        else
            this.isTrue(!condition);
    }
}