const {stddev} = require('../utils')
module.exports = function(season) {
    const instances = season.firstVersusLast()
    return {
        score: instances.reduce((a,b)=>a+b, 0),
        stats:{
            "First vs. Last":instances.join(',')
        }
    }
}