const {stddev} = require('../utils')

// Each team should play on each field a roughly even number of times across
// the season. Score is the average per-team stddev across fields.
module.exports = {
	description:
		'Each team should play on each field a similar number of times across the season. ' +
		'Pain is the average per-team standard deviation of field counts × 5.',
	measure(schedule) {
		const counts = schedule.teamFieldCounts() // [team][field]
		const perTeamStddevs = counts.map(stddev)
		const avgStddev = perTeamStddevs.reduce((a,b)=>a+b,0) / perTeamStddevs.length
		return {
			score: avgStddev * 5,
			stats: {
				"Field stuck/team": perTeamStddevs.map(v => v.toFixed(1)).join(','),
			}
		}
	}
}
