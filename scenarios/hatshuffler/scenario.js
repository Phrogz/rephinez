require('./utils')
const {Player, Season} = require('./gru')
const csv = require('./csv-parse/lib/sync')
const fs = require('fs')

module.exports = {
    name: 'HatShuffler',

    initial: createSeason({
        playerData: `${__dirname}/data/demo.csv`,  // see data/README.md for file details
        // season:  `${__dirname}/data/seed.csv`,  // load this file as the initial season
        teams:   4,                                // how many teams are the players split into each round
        rounds:  6,                                // how many rounds of play are there
    }),

    vary:  Season.prototype.swizzle,
    save:  Season.prototype.toCSV,
    load:  Season.fromCSV,
    clone: Season.prototype.duplicate,

    tempStart: 5,
    tempFalloffVariations: 100,

    stopAfterVariations:    1e5,
    // stopAfterScore:    9,
    restartAfterVariations: 5e2,
    restartAfterScore:      18,
    // restartAfterTemperature: 0.001,
    checkinAfterVariations: 5e3,

    // rankings to run, and how important each ranking is relative to the others
    weightings: {
        distributedWomen:      0, // not needed; women are pre-distributed and kept that way by gender-based swaps
        distributedGiants:     4,
        distributedSpeed:      2,
        distributedXP:         1,
        teamsAreFair:          3,
        playerExposure:        6,
        distributedScheduling: 4,
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