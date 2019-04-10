module.exports = {
    name: 'Function Maximizer',

    initial: () => 0.5,
    vary:    x  => Math.min(1,Math.max(0,x+(Math.random()-0.5)*0.02)),
    save:    x  => ({content:x+'', type:'txt'}),
    load:    parseFloat,

    tempStart:              50,
    tempFalloffVariations:  500,

    restartAfterVariations: 1e3,
    // stopAfterTime:            1,
    stopAfterVariations:    9990,

    yardsticks: { max:1 }
}

function initial() { return 0.5 }