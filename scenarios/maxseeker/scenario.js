module.exports = {
    name: 'Function Maximizer',

    initial: () => 0.5,
    vary:    x  => Math.min(1,Math.max(0,x+(Math.random()-0.5)*0.1)),
    save:    x  => ({content:x+'', type:'txt'}),
    load:    parseFloat,

    tempStart:              5,
    tempFalloffVariations:  50,

    restartAfterVariations: 1e2,
    // stopAfterTime:            1,
    stopAfterVariations:    1e3,

    weightings: {
        max:   1,
    }
}

function initial() { return 0.5 }