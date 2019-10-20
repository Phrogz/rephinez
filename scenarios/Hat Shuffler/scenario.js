require('./utils')
const {Player, Season} = require('./gru')
const csv = require('./csv-parse/lib/sync')
const fs = require('fs')

module.exports = {
    name: 'HatShuffler',

    initial: _ => createSeason({
        playerData: `${__dirname}/data/demo.csv`,  // see data/README.md for file details
        // season:  `${__dirname}/data/seed.csv`,  // load this file as the initial season
        teams:   4,                                // how many teams are the players split into each round
        rounds:  6,                                // how many rounds of play are there
    }),

    vary:  Season.prototype.swizzle,
    save:  Season.prototype.toCSV,
    load:  Season.fromCSV,
    html:  Season.prototype.html,
    clone: Season.prototype.duplicate,

    tempStart: 5,
    tempFalloffVariations: 100,

    restartAfterVariations: 2e2,

    stopAfterVariations:    1e4,
    // stopAfterScore:    9,
    restartAfterScore:      18,
    // restartAfterTemperature: 0.001,
    // checkinAfterVariations: 5e3,
	checkinAfterTime:       0.2,

    // rankings to run, and how important each ranking is relative to the others
    yardsticks: {
        "Distributed Women":      0, // not needed; women are pre-distributed and kept that way by gender-based swaps
        "Distributed Giants":     4,
        "Distributed Speed":      2,
        "Distributed XP":         1,
        "Fair Teams":             3,
        "Player Exposure":        6,
        "Distributed Scheduling": 4,
    }
}

function createSeason({playerData='data/demo.csv', savedSeason, teams=4, rounds=6}={}) {
	const playercsv = fs.readFileSync(playerData).toString()
	const players = csv(playercsv, {columns:true, delimiter:','}).map(p => Player.fromGRUCSV(p))
	if (savedSeason) {
		return Season.import(fs.readFileSync(savedSeason).toString(), players)
	} else {
		return Season.fromPlayers(players, teams, rounds)
	}
}