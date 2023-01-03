
function sampleArray(a) {
	return a[(a.length*Math.random())<<0]
}

function pairwiseCombinations(upToN) {
	const pairs = Array.from(Array(upToN).keys())
	return [...pairs.flatMap((v1,i) => pairs.slice(i+1).map(v2 => [v1,v2]))]
}

class Game {
	constructor(t1,t2) {
		if (t2<t1) [t1,t2] = [t2,t1]
		this.t1 = t1
		this.t2 = t2
		this.teams = [t1,t2]
		this.lookup = {[t1]:true, [t2]:true}
	}
	toString() { return '['+this.teams+']' }
}

class Round {
	constructor(games=[]) {
		this.games = games
	}
	static fromArray(a) {
		return new Round(a.map( ([t1,t2]) => new Game(t1,t2) ))
	}
	clone() {
		return new Round([...this.games])
	}
	toString() { return '['+this.games+']' }
}

class Schedule {
	constructor(rounds=[]) {
		this.rounds = rounds
		const numTeams = Math.max.apply(Math, this.rounds[0].games.flatMap(g => g.teams)) + 1
		this.blankCount = Array(numTeams).fill(0)

		this.roundPairs = pairwiseCombinations(this.rounds.length)
		this.gamePairs  = pairwiseCombinations(this.rounds[0].games.length)
		this.teamPairs  = pairwiseCombinations(numTeams)
	}

	static fromArray(a) {
		return new Schedule(a.map(Round.fromArray))
	}

	clone() {
		return new Schedule(this.rounds.map(r => r.clone()))
	}

	html() {
		return `<table>${
			this.rounds.map(r => `<tr>${
				r.games.map(g => `<td>${g.teams.map(n=>`T${n+1}`).join(' vs ')}</td>`).join('')
			}</tr>`).join('')
		}</table>`
	}

	doubleHeaders() {
		const result = [...this.blankCount]
		this.rounds.forEach(round => {
			const lastGameByTeam = {}
			round.games.forEach((g,i) => {
				if (lastGameByTeam[g.t1] == i-1) result[g.t1]++
				if (lastGameByTeam[g.t2] == i-1) result[g.t2]++
				lastGameByTeam[g.t1] = i;
				lastGameByTeam[g.t2] = i;
			})
		})
		return result
	}

	tripleHeaders() {
		const result = [...this.blankCount]
		this.rounds.forEach(round => {
			for (let i=2; i<round.games.length; ++i) {
				round.games[i].teams.forEach(t => {
					if (round.games[i-2].lookup[t] && round.games[i-1].lookup[t]) result[t]++
				})
			}
		})
		return result
	}

	earlyGames() {
		const result = [...this.blankCount]
		this.rounds.forEach(round => {
			const foundThisRound = {}
			for (let i=0;i<2;++i) {
				round.games[i].teams.forEach(t => {
					if (!foundThisRound[t]) {
						foundThisRound[t] = true
						result[t]++
					}
				})
			}
		})
		return result
	}

	lateGames() {
		const result = [...this.blankCount]
		const lastGame = this.rounds[0].games.length-1;
		this.rounds.forEach((round,ri) => {
			const foundThisRound = {}
			for (let i=0;i<2;++i) {
				round.games[lastGame-i].teams.forEach((t,ti) => {
					if (!foundThisRound[t]) {
						foundThisRound[t] = true
						if (typeof result[t]!=='number') {
							console.log('WHAT TEAM IS THIS?!', t, result)
						}
						result[t]++
					}
				})
			}
		})
		return result
	}

	multipleByes() {
		const result = [...this.blankCount]
		this.rounds.forEach(round => {
			const lastGameIndexByTeam = {}
			round.games.forEach((game,i) => {
				game.teams.forEach(t => {
					if (lastGameIndexByTeam[t]!=null && (i-lastGameIndexByTeam[t])>=3) result[t] += (i-lastGameIndexByTeam[t]-2)**3;
					lastGameIndexByTeam[t] = i;
				})
			})
		})
		return result
	}

	gameCountsPerRound() {
		return this.rounds.map(round => {
			const gamesByTeamThisRound = [...this.blankCount]
			round.games.forEach(game => {
				game.teams.forEach(t => {
					gamesByTeamThisRound[t] ||= 0
					gamesByTeamThisRound[t] += 1
				})
			})
			return gamesByTeamThisRound
		})
	}

	firstVersusLast() {
		const result = [...this.blankCount]
		this.rounds.forEach((round,r) => {
			const gamesPlayedByTeam = [...this.blankCount]
			round.games.forEach(game => {
				if (gamesPlayedByTeam[game.t1]===2 && gamesPlayedByTeam[game.t2]===0) result[game.t1]++;
				if (gamesPlayedByTeam[game.t2]===2 && gamesPlayedByTeam[game.t1]===0) result[game.t2]++;
				gamesPlayedByTeam[game.t1]++
				gamesPlayedByTeam[game.t2]++
			})
		})
		return result
	}

	swapRounds() {
		const roundPair = sampleArray(this.roundPairs);
		[this.rounds[roundPair[0]], this.rounds[roundPair[1]]] = [this.rounds[roundPair[1]], this.rounds[roundPair[0]]]
		return this
	}

	swapGamesInAnyRound() {
		const round = sampleArray(this.rounds)
		const gamePair = sampleArray(this.gamePairs);
		[round.games[gamePair[0]], round.games[gamePair[1]]] = [round.games[gamePair[1]], round.games[gamePair[0]]]
		return this
	}

	swapGames() {
		const roundPair = sampleArray(this.roundPairs);
		const r1 = this.rounds[roundPair[0]]
		const r2 = this.rounds[roundPair[1]]
		const i1 = (Math.random() * r1.games.length) << 0
		const i2 = (Math.random() * r2.games.length) << 0;
		[r1.games[i1], r2.games[i2]] = [r2.games[i2], r1.games[i1]]
		return this
	}

	toString() { return '['+this.rounds.join(',\n')+']' }
}

// Calculate a round-robin schedule using the 'circle' algorithm
// https://en.wikipedia.org/wiki/Round-robin_tournament#Scheduling_algorithm
function roundRobin(teams) {
	const loop = Array.from(Array(teams).keys())
	const rounds = []
	for (let i=1; i<teams; ++i) {
		const round = []
		rounds.push(round)
		for (let j=0; j<teams/2; ++j) {
			round.push([loop[j], loop[teams-j-1]].sort())
		}
		loop.splice(1,0,loop.pop())
	}
	return rounds
}

// Play multiple rounds of a round-robin tournament per a single 'round',
// with a maximum number of games allowed per round, while ensuring that
// every team plays the same number of games each round, and that every
// team plays every other team as soon as possible.
function multiGameRobin({teams=8, maxGamesPerRound=12, rounds=8}={}) {
	if (teams%2) console.error('number of teams must be even')
	const subrounds = roundRobin(teams)

	// How many games each team can play
	const gamesPerTeam = Math.floor(maxGamesPerRound / teams * 2)

	const schedule = []
	for (let r=0; r<rounds; ++r) {
		let round = []
		for (let i=0; i<gamesPerTeam; ++i) {
			round = round.concat(subrounds[(r*gamesPerTeam+i) % subrounds.length])
		}
		schedule[r] = round
	}

	return schedule
}

module.exports = {
	name: 'Single-Field Multi-Team Schedule',

	// initial: () => Schedule.fromArray(
	// 	[[[1,2],[1,4],[2,3],[1,6],[3,4],[2,5],[4,6],[3,7],[0,5],[0,6],[5,7],[0,7]],
	// 	 [[3,5],[1,3],[1,5],[0,3],[1,7],[5,6],[0,4],[6,7],[0,2],[4,7],[2,6],[2,4]],
	// 	 [[1,6],[0,1],[3,6],[1,4],[0,6],[3,4],[0,7],[2,3],[4,5],[2,7],[5,7],[2,5]],
	// 	 [[2,4],[4,6],[2,6],[0,4],[1,2],[6,7],[0,3],[1,7],[0,5],[3,7],[1,5],[3,5]]]
	// ),
	initial: () => Schedule.fromArray(multiGameRobin({teams:8, rounds:4, maxGamesPerRound:12})),
	vary:    Schedule.prototype.swapGamesInAnyRound,
	save:    s => ({content:s+'', type:'json'}),
	html:    Schedule.prototype.html,
	load:    (json) => Schedule.fromArray(JSON.parse(json)),
	clone:   Schedule.prototype.clone,

	tempStart:                15, // temperature to use when starting a round of optimization
	tempFalloffVariations:    20, // number of variations after which it should reach one percent of initial temp
	restartAfterVariations:   60, // restart a new round after this many variations in the round
	checkinAfterTime:         1,  // updates once per second
	stopAfterTime:            30, // stop optimization after this many seconds

	yardsticks: {
		"Games per Round"    : 50,
		"Multiple Byes"      : 5,
		"Double Headers"     : 0.01,
		"Triple Headers"     : 50,
		"Even Scheduling"    : 3,
		"First vs Last"      : 0.5,
		"Even First vs Last" : 1,
	}

};