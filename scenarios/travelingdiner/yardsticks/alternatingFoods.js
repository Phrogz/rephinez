module.exports = function(route) {
   let backToBacks = 0
   route.eachLeg((a,b) => backToBacks += (a.kind===b.kind) ? 1 : 0)
   return { score:backToBacks }
}