const {stddev} = require('../utils')

// Each team should walk a similar total distance across the season. This is
// distinct from "Field Moves" (which minimizes total / squared pain): here we
// only care that whatever walking happens is distributed evenly. Score = stddev
// of seasonal walk totals.
module.exports = {
	description:
		'Whatever walking happens should be shared fairly across teams. ' +
		'Pain is the standard deviation of per-team seasonal walk totals × 5.',
	measure(schedule) {
		const byRound = schedule.walkingDistanceByTeam()
		const totals = byRound.map(weeks => weeks.reduce((a,b)=>a+b,0))
		return {
			score: stddev(totals) * 5,
			stats: {
				"Walk dist/team": totals.join(','),
			}
		}
	}
}
