const {stddev} = require('../utils')
module.exports = function(season) {
    const gameCounts = season.gameCountsPerRound()
    const score = gameCounts.reduce((sum,games) => sum + stddev(games), 0)
    return {
        score: score,
        stats:{
            "Games/Round":"\n" + gameCounts.map(byTeam => `   ${byTeam.join()}`).join("\n"),
        }
    }
}