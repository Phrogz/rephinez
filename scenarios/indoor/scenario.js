
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
         for (let i=0;i<3;++i) {
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
         for (let i=0;i<3;++i) {
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

   gameGaps() {
      const result = [...this.blankCount]
      this.rounds.forEach(round => {
         const lastGameIndexByTeam = {}
         round.games.forEach((game,i) => {
            game.teams.forEach(t => {
               if (lastGameIndexByTeam[t]!=null) result[t] += i-lastGameIndexByTeam[t]-1;
               lastGameIndexByTeam[t] = i;
            })
         })
      })
      return result
   }

   previousWeekRepeats() {
      const result = [...this.blankCount]

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

const eightTeams = Schedule.fromArray(
  [[[0,1],[1,2],[0,2],[3,1],[3,0],[2,4],[3,5],[4,6],[4,7],[5,6],[5,7],[6,7]],
   [[7,6],[6,2],[7,2],[0,6],[0,7],[2,3],[0,4],[3,1],[5,4],[4,1],[3,5],[5,1]],
   [[2,5],[4,5],[0,2],[2,4],[0,5],[1,4],[6,0],[1,7],[1,3],[7,6],[3,6],[7,3]],
   [[4,7],[4,3],[7,3],[5,4],[5,7],[3,6],[5,0],[1,0],[6,2],[6,1],[0,2],[1,2]],
   [[1,5],[1,6],[2,5],[1,7],[5,6],[2,7],[4,6],[2,3],[0,7],[3,4],[0,3],[0,4]]]
)

const sixTeams = Schedule.fromArray(
 [[[0,1],[2,1],[2,0],[1,3],[2,4],[0,5],[3,4],[5,3],[5,4]],
  [[0,3],[0,5],[5,3],[1,0],[3,2],[4,5],[4,1],[2,1],[4,2]],
  [[1,4],[2,1],[4,0],[1,5],[2,0],[3,4],[5,2],[3,0],[3,5]],
  [[5,2],[4,2],[5,4],[3,2],[5,1],[0,4],[3,1],[0,3],[0,1]],
  [[3,1],[1,4],[3,4],[1,5],[3,2],[4,0],[2,5],[0,5],[0,2]]]
)

module.exports = {
   name: 'Single-Field Multi-Team Schedule',

   initial: () => eightTeams,
   vary:    Schedule.prototype.swapGamesInAnyRound,
   save:    s => ({content:s+'', type:'json'}),
   // load:    ƒ,  // a function that converts a serialized state into a real one
   clone:   Schedule.prototype.clone,

   /*** controlling the temperature; either falloff time or variations must be supplied (but not both) ******/
   tempStart:                  10, // temperature to use when starting a round of optimization
   // tempFalloffTime:            2, // number of seconds after which it should reach one percent of initial temp
   tempFalloffVariations:    1e2, // number of variations after which it should reach one percent of initial temp

   /*** how often to peek at the optimization progress ******************************************************/
   // checkinAfterTime:           0.5, // invoke the 'checkin' callback every this-many seconds
   checkinAfterVariations:   1e4,

   /*** (optional) occasionally restart optimization, starting from the best state **************************/
   // restartAfterTime:           3, // restart a new round after this many seconds in the round
   restartAfterVariations:   5e2, // restart a new round after this many variations in the round
   // restartAfterScore:         20, // restart a new round if a score greater than or equal to this is accepted
   // restartAfterTemperature: 1e-6, // restart a new round if the temperature falls below this

   /*** when to stop and serialize the optimization; at least one of these should be supplied  **************/
   // stopAfterTime:             99, // stop optimization after this many seconds
   stopAfterVariations:      1e6, // stop optimization after this many variations
   // stopAfterScore:             0, // stop optimization if a measurement produces a score less than or equal to this
   // stopAfterRounds:          1e2, // stop optimization after this many rounds have been exhausted

   // rankings to run, and the default importance of each ranking relative to the others
   yardsticks: {
      doubleheaders:  10,
      tripleheaders:  100,
      evenscheduling: 1,
      gamegaps:       5,
   }

};