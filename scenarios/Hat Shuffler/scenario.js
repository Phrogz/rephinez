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
    tempFalloffVariations:  100,
    restartAfterVariations: 3e2,
    stopAfterTime:           10,
	checkinAfterTime:         1,

    // rankings to run, and how important each ranking is relative to the others
    yardsticks: {
        "Distributed Giants":     4,
        "Distributed Speed":      2,
        "Distributed XP":         1,
        "Fair Teams":             3,
        "Player Exposure":        6,
        "Distributed Scheduling": 4,
    }
}

function createSeason({playerData='data/demo.csv', savedSeason, teams=4, rounds=6}={}) {
	// \ufeff is the UTF8 BOM; the csv library barfs on it, so it needs to be removed, if present.
	const playercsv = fs.readFileSync(playerData).toString().replace(/^\ufeff/, '')
    const players = csv(playercsv, {columns:true, delimiter:','}).map(p => Player.fromGRUCSV(p))

    // Double-check baggage assignments
	players.filter(p => p.baggageName).forEach(p => {
        const other = p.baggage;
		if (other) {
            if (other===p) {
                console.warn(`"${p.name} asked to baggage with themself, and that's not valid.`)
                delete p.baggageName;
            } else {
                if (other.baggageName) {
                    if (other.baggage!==p) {
                        console.warn(`"${p.name}" asked to baggage with "${other.name}", but they asked to baggage with "${other.baggageName}".`)
                        delete p.baggageName;
                    }
                } else {
                    console.warn(`"${p.name}" asked to baggage with "${other.name}", but they did not select any baggage.`)
                    delete p.baggageName;
                }
            }
		} else {
			console.warn(`"${p.name}" asked to baggage with "${p.baggageName}", but I don't know who that is.`)
            delete p.baggageName;
		}
	});

	if (savedSeason) {
		return Season.import(fs.readFileSync(savedSeason).toString(), players)
	} else {
		return Season.fromPlayers(players, teams, rounds)
	}
}