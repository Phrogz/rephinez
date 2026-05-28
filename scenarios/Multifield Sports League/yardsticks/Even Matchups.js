const {stddev} = require('../utils')

// Each pair of teams should meet a similar number of times. We collect the
// counts for the upper triangle of the matchup matrix and score by stddev
// (so the perfect score is 0 when every pair has met the same number of times).
module.exports = {
	description:
		'Every pair of teams should meet a similar number of times across the season. ' +
		'Pain is the standard deviation of all pairwise matchup counts × 10.',
	measure(schedule) {
		const m = schedule.matchupCounts()
		const counts = []
		const N = schedule.numTeams
		for (let i=0; i<N; ++i)
			for (let j=i+1; j<N; ++j)
				counts.push(m[i][j])

		const min = Math.min(...counts)
		const max = Math.max(...counts)
		return {
			score: stddev(counts) * 10,
			stats: {
				"Spread": `${min}..${max}`,
			}
		}
	}
}
