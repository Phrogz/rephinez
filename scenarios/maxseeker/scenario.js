module.exports = {
    name: 'Function Maximizer',

    initial: () => 0.5,
    vary:    x  => Math.min(1,Math.max(0,x+(Math.random()-0.5)*0.02)),
    save:    x  => ({content:x+'', type:'txt'}),
    load:    parseFloat,
    html:    x  => `x = ${x}`,

    tempStart:              50,
    tempFalloffVariations:  500,

    restartAfterVariations: 1e3,
    stopAfterVariations:    1e5,

    yardsticks: { max:1 }
}