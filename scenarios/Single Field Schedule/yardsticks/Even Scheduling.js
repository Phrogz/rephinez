const {stddev} = require('../utils')
module.exports = function(season) {
    const early = season.earlyGames()
    const late  = season.lateGames()
    const s1 = stddev(early),
          s2 = stddev(late);
    return {
        score: s1 + s2,
        stats:{
            "Early Games":early.join(','),
            "Late Games":late.join(',')
        }
    }
}