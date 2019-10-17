const {stddev} = require('../utils')
module.exports = function(season) {

    const gaps = season.multipleByes()
    return {
        score: gaps.reduce((a,b)=>a+b, 0) + stddev(gaps),
        stats:{
            "Multiple Byes":gaps.join(',')
        }
    }
}