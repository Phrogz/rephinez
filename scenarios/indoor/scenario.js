class Game {
   constructor(t1,t2) {
      if (t2<t1) [t1,t2] = [t2,t1]
      this.t1 = t1
      this.t2 = t2
   }
}

class Round {
   constructor(games=[]) {
      this.games = games
   }
   static fromArray(a) {
      return new Round(a.map( ([t1,t2]) => new Game(t1,t2) ))
   }
   doubleHeaders() {
      const lastGameByTeam = {}
      const doubles = {}
      this.games.forEach((g,i) => {
         if (lastGameByTeam[g.t1] == i-1) doubles[g.t1] = (doubles[g.t1] || 0) + 1
         if (lastGameByTeam[g.t2] == i-1) doubles[g.t2] = (doubles[g.t2] || 0) + 1
         lastGameByTeam[g.t1] = i;
         lastGameByTeam[g.t2] = i;
      })
      return doubles
   }
   tripleHeaders() {

   }
   doubleSkips() {

   }
   tripleSkips() {

   }
}

class Schedule {
   constructor(rounds=[]) {
      this.rounds = rounds
   }
   static fromArray(a) {
      return new Schedule(a.map(Round.fromArray))
   }
}

const eightTeams = Schedule.fromArray(
  [[[1,2],[2,3],[1,3],[4,2],[4,1],[3,5],[4,6],[5,7],[5,8],[6,7],[6,8],[7,8]],
   [[8,7],[7,3],[8,3],[1,7],[1,8],[3,4],[1,5],[4,2],[6,5],[5,2],[4,6],[6,2]],
   [[3,6],[5,6],[1,3],[3,5],[1,6],[2,5],[7,1],[2,8],[2,4],[8,7],[4,7],[8,4]],
   [[5,8],[5,4],[8,4],[6,5],[6,8],[4,7],[6,1],[2,1],[7,3],[7,2],[1,3],[2,3]],
   [[2,6],[2,7],[3,6],[2,8],[6,7],[3,8],[5,7],[3,4],[1,8],[4,5],[1,4],[1,5]]]
)

const sixTeams = Schedule.fromArray(
 [[[1,2],[3,2],[3,1],[2,4],[3,5],[1,6],[4,5],[6,4],[6,5]],
  [[1,4],[1,6],[6,4],[2,1],[4,3],[5,6],[5,2],[3,2],[5,3]],
  [[2,5],[3,2],[5,1],[2,6],[3,1],[4,5],[6,3],[4,1],[4,6]],
  [[6,3],[5,3],[6,5],[4,3],[6,2],[1,5],[4,2],[1,4],[1,2]],
  [[4,2],[2,5],[4,5],[2,6],[4,3],[5,1],[3,6],[1,6],[1,3]]]
)

console.log(s.rounds[0].doubleHeaders())

module.exports = {

};