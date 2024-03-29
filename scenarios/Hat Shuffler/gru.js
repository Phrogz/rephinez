/***********************************************************************************************************
A Season is basically an array of Rounds
  * someSeason.rounds -> the array of Round objects
  * someSeason.teams  -> constructs an array of teams from all rounds

A Round is basically an array of Teams
  * someRound.teams            -> the array of Team objects
  * someRound.teamForPlayer(p) -> returns the Team object given a Player object

A Team is an array of Players, sorted into men (males) and women (females). My apologies to non-binaries.
  * someTeam.men         -> the array of 'male' Players
  * someTeam.women       -> the array of 'female' Players
  * someTeam.players     -> a new array of both men and women
  * someTeam.includes(p) -> returns true if the team has the player, false otherwise

A Player is a collection of useful properties you can use to evaluate and compare them:
  * somePlayer.name           -> "Gavin Kistner"
  * somePlayer.heightInInches -> 71
  * somePlayer.age            -> 46
  * somePlayer.playingSince   -> 1992
  * somePlayer.male           -> true
  * somePlayer.athleticism    -> an integer number based on skill in this area
  * somePlayer.experience     -> an integer number based on skill in this area
  * somePlayer.throwSkills    -> an integer number based on skill in this area
  * somePlayer.vector         -> (convenience) a number combining athleticism, experience, and throwSkills
  * somePlayer.tall           -> (convenience) true if heightInInches >= 73, false otherwise
  * somePlayer.experienced    -> (convenience) true if playingSince < 2010, false otherwise
  * somePlayer.ranking()      -> (convenience) cascading sort used when creating initial 'fair' teams
***********************************************************************************************************/

const csv = require('./csv-parse/lib/sync')

const AthleticismToRank = {
	"I'm not in very good shape or I'm not all that quick.":1,
	"I'm not that fast and don't have great endurance but can occasionally rise to the call.":2,
	"I grind it out and get the job done most of the time.":3,
	"I'm a good athlete and consider myself above average.":4,
	"I'm a great athlete. I can jump with, sprint with, and hang with most anyone.":5,
}

const ExperienceToRank = {
	"I've never played ultimate before":0,
	"Intramurals":1,
	"Pickup":1,
	"League / HS Regionals":2,
	"College Club / YCCs":3,
	"Club":4,
	"Club - Made Regionals / Masters Nationals / College Club Nationals":5,
	"Club - Made Nationals":6,
}

// const TeamNames = 'Red Green Blue White Orange Purple Pink'.split(' ')
// Make this smaller to reduce HTML to try to avoid https://stackoverflow.com/questions/58425134/forcing-synchronous-node-js-ipc
const TeamNames = 'T0 T1 T2 T3 T4 T5 T6 T7'.split(' ')
TeamNames.forEach((name,i)=>TeamNames[name] = i)

// Gross global hack used to associate players with their baggage, since the asynchronous library cannot handle circular references between players.
const PlayerPool = new Map();
class Player {
	constructor(obj) {
		if (obj) Object.assign(this, obj);
	}
	static fromGRUCSV(csvObj) {
		const p = new Player;

		p.name = `${csvObj.first_name.trim()} ${csvObj.last_name.trim()}`
		PlayerPool.set(p.name, p)

		const [feet, inches] = csvObj.Height.match(/\d+/g).map(parseFloat)
		p.heightInInches = feet*12 + inches
		p.tall = p.heightInInches>=73

		p.athleticism = AthleticismToRank[csvObj.Ath] || 1
		p.experience  = ExperienceToRank[csvObj.HighestLevel5] || 1
		p.throwSkills = (csvObj.Throws.match(/,/g) || []).length + 1

		const sum = p.athleticism + p.experience*5/6 + p.throwSkills*5/7
		p.vector = sum>=12.2 ? 5 : sum>=11.2 ? 4 : sum>=9.8 ? 3 : sum>=8.2 ? 2 : 1

		p.male = /^male/i.test(csvObj.gender)
		p.sex  = p.male ? 'men' : 'women' // make it easier to find correct team side

		p.age = csvObj.age_on_evaluation_date*1

		p.speedy = p.athleticism > 3
		p.baggageName = (csvObj.baggage || '').replace(/  +/g, ' ')

		p.playingSince = csvObj['Yr Started']*1
		p.experienced = p.playingSince < 2010

		return p
	}
	get baggage(){ return PlayerPool.get(this.baggageName) }
	ranking() { return [-this.vector, this.tall*1, -this.athleticism, this.age] }
	toString() { return `${this.name}${this.male?'[M]':'[F]'}${this.tall?'(T)':''}` }
}

class Team {
	constructor(men=[], women=[]) {
		this.men=[...men]
		this.women=[...women]
	}
	duplicate() { return new Team(this.men, this.women) }
	get players(){ return [...this.men, ...this.women] }
	toString() { return this.players.join(', ') }
	includes(player) { return (player.male ? this.men : this.women).includes(player) }
}

class Round {
	constructor(teams=[]) { this.teams = teams.map(t=>t.duplicate()) }
	teamForPlayer(player) { return this.teams.find(t => t.includes(player)) }
	duplicate() { return new Round(this.teams) }
	toString() { return this.teams.map(t=>t+'').join('\n') }
}

// Used to randomly pick a pair of items out of an array of a certain size
const combinationsByArraySize = {
	3: [[0,1], [0,2], [1,2]],
	4: [[0,1], [0,2], [0,3], [1,2], [1,3], [2,3]],
	5: [[0,1], [0,2], [0,3], [0,4], [1,2], [1,3], [1,4], [2,3], [2,4], [3,4]],
	6: [[0,1], [0,2], [0,3], [0,4], [0,5], [1,2], [1,3], [1,4], [1,5], [2,3], [2,4], [2,5], [3,4], [3,5], [4,5]],
	7: [[0,1], [0,2], [0,3], [0,4], [0,5], [0,6], [1,2], [1,3], [1,4], [1,5], [1,6], [2,3], [2,4], [2,5], [2,6], [3,4], [3,5], [3,6], [4,5], [4,6], [5,6]],
	8: [[0,1], [0,2], [0,3], [0,4], [0,5], [0,6], [0,7], [1,2], [1,3], [1,4], [1,5], [1,6], [1,7], [2,3], [2,4], [2,5], [2,6], [2,7], [3,4], [3,5], [3,6], [3,7], [4,5], [4,6], [4,7], [5,6], [5,7], [6,7]],
}

const W='women', M='men';

class Season {
	constructor(rounds=[]) {
		this.rounds=rounds.map(r=>r.duplicate())
	}

	static fromPlayers(players, teamCount=4, roundCount=5) {
		// Distribute men and women across teams based on skill using a hellaciously-inefficient algorithm
		const teams = Array.from({length:teamCount}, ()=>new Team);

		// Put people with baggage in before those without, to help balance at the end
		players.sortBy(p => [p.baggage ? 0 : 1, p.ranking()]).forEach(p => {
			if (p._addedToTeam) return;
			// Find the team with the fewest number of players matching this player's sex
			const leastFull = teams.sortBy(t => t[p.sex].length)[0];
			leastFull[p.sex].push(p);
			p._addedToTeam = true;
			if (p.baggage) {
				leastFull[p.baggage.sex].push(p.baggage);
				p.baggage._addedToTeam = true;
			}
		});

		const rounds = Array.from({length:roundCount}, ()=>new Round(teams));
		return new Season(rounds);
	}

	get teams() { return [...new Set(this.rounds.flatMap(g => g.teams))] }
	duplicate() { return new Season(this.rounds) }
	swizzle() {
		const round = this.rounds.sample()

		// Pick a random pair of unique indices
		const teamIndices = combinationsByArraySize[round.teams.length].sample();
		let t1 = round.teams[teamIndices[0]],
		    t2 = round.teams[teamIndices[1]]
		let sex = Math.random()<0.3 ? W : M;

		// Pick random players on those two teams of the same sex
		let t1i = (t1[sex].length*Math.random()) << 0,
		    t2i = (t2[sex].length*Math.random()) << 0;
		let p1 = t1[sex][t1i],
		    p2 = t2[sex][t2i];

		// Uh…what? This somehow works around a bug.
		let hack1 = p1+'', hack2=p2+'';

		if (!p1.baggage && !p2.baggage) {
			// Neither have baggage? Great, it's a simple swap
			// console.log(`Case 1: Swapping #${t1i} ${p1} with #${t2i} ${p2}`);
			t1[sex][t1i] = p2;
			t2[sex][t2i] = p1;

		} else if (p1.baggage && p2.baggage && p1.baggage.male===p2.baggage.male) {
			// Both have baggage of the same sex as each other? OK, swap them, too.

			// console.log(`Case 2a: Swapping #${t1i} ${p1} with #${t2i} ${p2}`)
			t1[sex][t1i] = p2;
			t2[sex][t2i] = p1;

			sex = p1.baggage.sex;
			const b1i = t1[sex].indexOf(p1.baggage),
				  b2i = t2[sex].indexOf(p2.baggage);
			// console.log(`Case 2b: Swapping #${b1i} ${p1.baggage} with #${b2i} ${p2.baggage}`)
			t1[sex][b1i] = p2.baggage;
			t2[sex][b2i] = p1.baggage;

		} else if (p1.baggage && !p2.baggage || p2.baggage && !p1.baggage) {
			// Only one has baggage? Find a correct-sexed, unbaggaged player to use for this swap

			if (p2.baggage) {
				// Let's make it so that p1 is always the one with baggage; swap labels
				[t1, t2, p1, p2, t1i, t2i] = [t2, t1, p2, p1, t2i, t1i]
			}
			const unbagged = t2[p1.baggage.sex].filter(p => p!==p2 && !p.baggage)
			if (unbagged.length>0) {
				const b2 = unbagged.sample();
				const b1i = t1[p1.baggage.sex].indexOf(p1.baggage),
					  b2i = t2[b2.sex].indexOf(b2);
				// console.log(`Case 3a: Swapping #${t1i} ${p1} with #${t2i} ${p2}`)
				t1[sex][t1i] = p2;
				t2[sex][t2i] = p1;

				sex = b2.sex;

				// console.log(`Case 3b: Swapping #${b1i} ${p1.baggage} with #${b2i} ${b2}`)
				t1[sex][b1i] = b2;
				t2[sex][b2i] = p1.baggage;
			} else {
				// console.log(`could not find an unbaggaged player on ${p1.baggage.sex}`);
			}
		} else {
			// Baggaged men can't swap with man/woman baggage. Do nothing this time.
		}
		// console.log(t1.players.map(p => p?(p.male?'M':'F'):'!').join(''));
		// console.log(t2.players.map(p => p?(p.male?'M':'F'):'!').join(''));
		return this;
	}

	get players() { return this.rounds[0].teams.flatMap(t=>t.players) }

	toCSV() {
		const teamNameByTeam = new Map()
		this.rounds.forEach(r => r.teams.forEach((t,i) => teamNameByTeam.set(t,TeamNames[i])))
		return {
			content:this.players.map(p => [
					p.name,
					p.male ? 'M' : 'F',
					'', // blank column in our spreadsheet
					...this.rounds.map(r => teamNameByTeam.get(r.teamForPlayer(p)))
				].join('\t')
			).join('\n'),
			type:'csv'
		};
	}

	static fromCSV(csvString, players) {
		// Assumes a tab-delimited CSV file as output by Season.prototype.export()
		const seasonDetails = csv(csvString, {delimiter:'\t'})
		const playerByName = new Map(players.map(p=>[p.name,p]))
		const rounds = []
		const teamsByNameByRound = []
		const teamNumberByName = {}
		seasonDetails.forEach(row=>{
			const player = playerByName.get(row[0])
			// Skip the player name, sex, and blank column
			row.slice(3).forEach((teamName, roundIndex)=>{
				const round = rounds[roundIndex] = rounds[roundIndex] || new Round;
				const teamsThisRoundByName = teamsByNameByRound[roundIndex] = teamsByNameByRound[roundIndex] || {}
				const teamIndex = TeamNames[teamName]
				const team = round.teams[teamIndex] = round.teams[teamIndex] || new Team
				team[player.male ? 'men' : 'women'].push(player)
			})
		})
		return new Season(rounds)
	}

	html() {
		const teamNameByTeam = new Map()
		this.rounds.forEach(r => r.teams.forEach((t,i) => teamNameByTeam.set(t,TeamNames[i])))
		return `<table><thead><tr><th>Player</th>${
			this.rounds.map( (r,i) => `<th>Week ${i+1}</th>`).join('')
		}</tr></thead><tbody>${
			this.players.partition(p=>p.male).map(players => {
				return players.map(p => `<tr><th>${p.name}</th>${
					this.rounds.map(r => `<td>${teamNameByTeam.get(r.teamForPlayer(p))}</td>`).join('')
				}</tr>`).join('')
			}).join('')
		}</tbody><table>`
	}

	toString() { return this.rounds.map((r,i)=>`Round #${i+1}\n${r+''}\n`).join('\n')}
}

module.exports = { Player, Team, Round, Season }
