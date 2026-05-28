module.exports = {
	description:
		'Minimize how far teams walk between fields during an evening. ' +
		'Pain is the sum of per-move costs: ±1 field is free, ±2 costs 1, ±3 costs 8.',
	measure(schedule) {
		const pain = schedule.fieldMovesByTeam()
		const total = pain.reduce((a,b)=>a+b,0)
		return { score: total }
	}
}
