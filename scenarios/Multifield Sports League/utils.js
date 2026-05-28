function average(array) {
	return array.reduce((a,b)=>a+b, 0) / array.length
}

function stddev(a) {
	const avg = average(a)
	return Math.sqrt(average(a.map(n=>(n-avg)**2)))
}

function sampleArray(a) {
	return a[(a.length*Math.random())<<0]
}

function pairwiseCombinations(upToN) {
	const pairs = Array.from(Array(upToN).keys())
	return [...pairs.flatMap((v1,i) => pairs.slice(i+1).map(v2 => [v1,v2]))]
}

// Calculate a single round-robin schedule using the 'circle' algorithm
// https://en.wikipedia.org/wiki/Round-robin_tournament#Scheduling_algorithm
// Returns an array of (teams-1) sub-rounds, each with teams/2 pairs.
function roundRobin(teams) {
	const loop = Array.from(Array(teams).keys())
	const subrounds = []
	for (let i=1; i<teams; ++i) {
		const subround = []
		for (let j=0; j<teams/2; ++j) {
			const pair = [loop[j], loop[teams-j-1]]
			pair.sort((a,b)=>a-b)
			subround.push(pair)
		}
		subrounds.push(subround)
		loop.splice(1,0,loop.pop())
	}
	return subrounds
}

class Schedule {
	// games: 3D array of [t1,t2] pairs indexed by [round][slot][field]
	// dates: optional array of strings labeling each round (e.g. "Jun 1")
	// times: optional array of strings labeling each slot (e.g. "5:45pm")
	// teamNames: optional array of strings labeling each team
	// fieldNames: optional array of strings labeling each field
	constructor(games, meta={}) {
		this.games = games
		this.numRounds = games.length
		this.numSlots = games[0].length
		this.numFields = games[0][0].length

		const teamSet = new Set()
		games.forEach(round => round.forEach(slot => slot.forEach(g => {
			if (g) { teamSet.add(g[0]); teamSet.add(g[1]) }
		})))
		this.numTeams = teamSet.size

		this.dates      = meta.dates      || games.map((_,r) => `Week ${r+1}`)
		this.times      = meta.times      || games[0].map((_,s) => `Slot ${s+1}`)
		this.teamNames  = meta.teamNames  || Array.from({length:this.numTeams}, (_,t) => `T${t+1}`)
		this.fieldNames = meta.fieldNames || Array.from({length:this.numFields}, (_,f) => `Field ${f+1}`)

		this.roundPairs = pairwiseCombinations(this.numRounds)
		this.fieldPairs = pairwiseCombinations(this.numFields)
	}

	clone() {
		const games = this.games.map(round =>
			round.map(slot => slot.map(g => g ? [g[0],g[1]] : null))
		)
		return new Schedule(games, {
			dates: this.dates,
			times: this.times,
			teamNames: this.teamNames,
			fieldNames: this.fieldNames,
		})
	}

	// --- Variations ---
	// All variations preserve the invariant that each slot in each round
	// is a perfect partition of all teams (every team plays once per slot).

	// Pick a slot and swap two of its games' field assignments.
	swapFieldsInSlot() {
		const round = this.games[(Math.random()*this.numRounds)<<0]
		const slot = round[(Math.random()*this.numSlots)<<0]
		const [f1,f2] = sampleArray(this.fieldPairs);
		[slot[f1], slot[f2]] = [slot[f2], slot[f1]]
		return this
	}

	// Pick a slot and reverse the order of all its games (field 0 <-> last,
	// 1 <-> second-to-last, ...). Equivalent to swapping pairs of fields
	// simultaneously; gets out of dead-ends where individual single swaps all
	// score worse but the combined reversal is better.
	reverseSlot() {
		const round = this.games[(Math.random()*this.numRounds)<<0]
		const slot = round[(Math.random()*this.numSlots)<<0]
		slot.reverse()
		return this
	}

	// Pick the same slot index in two different rounds, swap a game between them.
	swapGamesAcrossRounds() {
		if (this.numRounds < 2) return this
		const [r1,r2] = sampleArray(this.roundPairs)
		const s = (Math.random()*this.numSlots)<<0
		const slot1 = this.games[r1][s], slot2 = this.games[r2][s]
		// Find a game in slot1 whose two teams also appear together in some game of slot2
		// Otherwise swapping breaks the partition. Easiest valid op: swap the entire slots.
		// Stick to swapping whole slots between rounds.
		this.games[r1][s] = slot2
		this.games[r2][s] = slot1
		return this
	}

	// Note: there is no Schedule.prototype.vary because the scenario.js file
	// owns variation strategy selection (with web-UI checkbox toggles). It
	// invokes the per-strategy methods on the schedule directly.

	// --- Measurements ---

	// counts[t1][t2] = number of times teams t1 and t2 played each other
	matchupCounts() {
		const m = Array.from({length:this.numTeams}, () => Array(this.numTeams).fill(0))
		this.games.forEach(round => round.forEach(slot => slot.forEach(g => {
			if (!g) return
			m[g[0]][g[1]]++
			m[g[1]][g[0]]++
		})))
		return m
	}

	// counts[team][field] = number of times this team played on this field
	teamFieldCounts() {
		const m = Array.from({length:this.numTeams}, () => Array(this.numFields).fill(0))
		this.games.forEach(round => round.forEach(slot => slot.forEach((g,f) => {
			if (!g) return
			m[g[0]][f]++
			m[g[1]][f]++
		})))
		return m
	}

	// counts[team][slot] = number of times this team played in this slot index
	teamSlotCounts() {
		const m = Array.from({length:this.numTeams}, () => Array(this.numSlots).fill(0))
		this.games.forEach(round => round.forEach((slot,s) => slot.forEach(g => {
			if (!g) return
			m[g[0]][s]++
			m[g[1]][s]++
		})))
		return m
	}

	// counts[team][round] = number of games this team plays this round (should always be numSlots)
	teamRoundCounts() {
		const m = Array.from({length:this.numTeams}, () => Array(this.numRounds).fill(0))
		this.games.forEach((round,r) => round.forEach(slot => slot.forEach(g => {
			if (!g) return
			m[g[0]][r]++
			m[g[1]][r]++
		})))
		return m
	}

	// For each team, count the number of "early repeats": opponents replayed
	// before the team has played every other team at least once. Walks the
	// season in slot-order (round 0 slot 0, round 0 slot 1, round 1 slot 0,
	// ...). Returns earlies[team] = count of premature re-plays.
	earlyRepeatsByTeam() {
		const N = this.numTeams
		const seen = Array.from({length:N}, () => new Set())
		const result = Array(N).fill(0)
		this.games.forEach(round => round.forEach(slot => slot.forEach(g => {
			if (!g) return
			const [a,b] = g
			for (const [self, other] of [[a,b],[b,a]]) {
				if (seen[self].size < N-1 && seen[self].has(other)) {
					result[self]++
				}
				seen[self].add(other)
			}
		})))
		return result
	}

	// Count matchups that occur more than once in the same week (round).
	// Returns the total number of duplicate occurrences across the season:
	// e.g. a matchup appearing twice in week 1 contributes 1; three times
	// contributes 2; etc.
	sameWeekRepeats() {
		let count = 0
		this.games.forEach(round => {
			const tally = {}
			round.forEach(slot => slot.forEach(g => {
				if (!g) return
				const key = g[0] < g[1] ? `${g[0]}-${g[1]}` : `${g[1]}-${g[0]}`
				tally[key] = (tally[key]||0) + 1
			}))
			Object.values(tally).forEach(n => { if (n > 1) count += n - 1 })
		})
		return count
	}

	// Raw walking distance per team per round. Distance is the number of
	// "fields crossed" between a team's two games in a single evening:
	//   |df| 0 or 1 -> 0  (same field or set up next door, no crossing)
	//   |df| 2      -> 1  (cross one field)
	//   |df| 3      -> 2  (cross two fields)
	// Returns dist[team][round].
	walkingDistanceByTeam() {
		const result = Array.from({length:this.numTeams}, () => Array(this.numRounds).fill(0))
		this.games.forEach((round, r) => {
			const lastFieldByTeam = {}
			round.forEach(slot => slot.forEach((g,f) => {
				if (!g) return
				g.forEach(t => {
					const prev = lastFieldByTeam[t]
					if (prev != null) {
						result[t][r] += Math.max(0, Math.abs(f - prev) - 1)
					}
					lastFieldByTeam[t] = f
				})
			}))
		})
		return result
	}

	// Per-team move pain across the season. Pain = max(0, |df|-1)^3:
	//   same field or ±1 -> 0
	//   ±2               -> 1
	//   ±3               -> 8
	fieldMovesByTeam() {
		const result = Array(this.numTeams).fill(0)
		this.games.forEach(round => {
			const lastFieldByTeam = {}
			round.forEach(slot => slot.forEach((g,f) => {
				if (!g) return
				g.forEach(t => {
					const prev = lastFieldByTeam[t]
					if (prev != null) {
						const d = Math.max(0, Math.abs(f - prev) - 1)
						result[t] += d*d*d
					}
					lastFieldByTeam[t] = f
				})
			}))
		})
		return result
	}

	// Count matchups that repeat in two consecutive time slots (regardless
	// of field), walking slots chronologically across weeks.
	consecutiveSlotRepeats() {
		let count = 0
		let prev = null
		for (let r=0; r<this.numRounds; ++r) {
			for (let s=0; s<this.numSlots; ++s) {
				const cur = new Set()
				for (let f=0; f<this.numFields; ++f) {
					const g = this.games[r][s][f]
					if (!g) continue
					cur.add(g[0] < g[1] ? `${g[0]}-${g[1]}` : `${g[1]}-${g[0]}`)
				}
				if (prev) for (const key of cur) if (prev.has(key)) count++
				prev = cur
			}
		}
		return count
	}

	toJSON() {
		return {
			games: this.games,
			dates: this.dates,
			times: this.times,
			teamNames: this.teamNames,
			fieldNames: this.fieldNames,
		}
	}

	static fromJSON(obj) {
		return new Schedule(obj.games, obj)
	}
}

// Build an initial valid schedule for `numTeams` teams across `numRounds` rounds,
// each with `numSlots` slots of `numFields` simultaneous games. Requires
// numTeams === numFields*2 and numTeams even.
function buildInitialSchedule({numTeams=8, numFields=4, numSlots=2, numRounds=8, meta={}}={}) {
	if (numTeams % 2) throw new Error('numTeams must be even')
	if (numTeams !== numFields*2) {
		throw new Error('this generator requires numTeams === numFields*2')
	}
	const subrounds = roundRobin(numTeams) // numTeams-1 sub-rounds, each a partition
	const games = []
	let sr = 0
	for (let r=0; r<numRounds; ++r) {
		const round = []
		for (let s=0; s<numSlots; ++s) {
			const partition = subrounds[sr % subrounds.length].map(p => [p[0],p[1]])
			sr++
			round.push(partition)
		}
		games.push(round)
	}
	return new Schedule(games, meta)
}

module.exports = {
	Schedule,
	buildInitialSchedule,
	roundRobin,
	stddev,
	average,
	sampleArray,
	pairwiseCombinations,
}
