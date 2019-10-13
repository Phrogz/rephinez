const {stddev} = require('./utils')
module.exports = function(season) {
    const gaps = season.gameGaps()
    return {
        score: gaps.reduce((a,b)=>a+b, 0) + stddev(gaps)*5,
        stats:{
            "Game Gaps":gaps.join(',')
        }
    }
}