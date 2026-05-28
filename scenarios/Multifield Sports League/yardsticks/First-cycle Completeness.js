// Each team should play every other team at least once before re-playing
// any of them. Walking the season in slot-order, we count "early repeats":
// any matchup that recurs while the team still has unmet opponents.
//
// Score is the total of those early repeats (heavily weighted by default,
// since this is a first-class fairness goal).
module.exports = {
	description:
		'Every team should play every other team at least once before any rematches. ' +
		'Pain is the number of times a team replays an opponent while still having unmet ones.',
	measure(schedule) {
		const earlies = schedule.earlyRepeatsByTeam()
		const total = earlies.reduce((a,b)=>a+b,0)
		return {
			score: total,
			stats: {
				"Early repeats by team": earlies.join(','),
				"Total early repeats":   total,
			}
		}
	}
}
