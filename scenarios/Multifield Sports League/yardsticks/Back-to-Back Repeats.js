module.exports = {
	description:
		'A matchup should not repeat in two consecutive time slots, including across weeks. ' +
		'Pain is the count of back-to-back repeated matchups.',
	measure(schedule) {
		const repeats = schedule.consecutiveSlotRepeats()
		return {
			score: repeats,
			stats: {
				"Back-to-back repeats": repeats,
			}
		}
	}
}
