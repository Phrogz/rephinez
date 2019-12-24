module.exports = function ({
	initialState,            // initial state to start optimizing from, instead of initial()
	initial,                 // function that produces the initial state to start optimizing from
	vary,                    // function/method to invoke on/with a state to get a new state
	measure,                 // function/method to invoke on/with a state to get a score
	clone,                   // optional function/method to invoke on/with a state to get an identical, decoupled state

	tempStart,               // temperature to use when starting a round
	tempFalloffTime,         // number of seconds after which it should reach one percent of initial temp
	tempFalloffVariations,   // number of variations after which it should reach one percent of initial temp

	stopAfterTime,           // stop running after this many seconds
	stopAfterVariations,     // stop running after this many variations
	stopAfterScore,          // stop running if a measurement produces a score less than or equal to this
	stopAfterRounds,         // stop running after this many rounds have been exhausted

	/*** (optional) occasionally restart optimization, starting from the best state ****************************/
	restartAfterTime,        // restart a new round after this many seconds in the round
	restartAfterVariations,  // restart a new round after this many variations in the round
	restartAfterScore,       // restart a new round if a score greater than or equal to this is accepted
	restartAfterTemperature, // restart a new round if the temperature falls below this

	/*** (optional) progress callback to invoke occasionally ***************************************************/
	checkinAfterTime,        // invoke the 'checkin' callback every this-many seconds
	checkinAfterVariations,  // invoke the 'checkin' callback every this-many variations
	checkinAfterScore,       // invoke the 'checkin' callback every this-many score improvements
	checkin,                 // function to invoke occasionally, passed an object with progress information:
							 //   * currentState:    the last state used
							 //   * currentScore:    the score of the last state
							 //   * bestState:       the best state found so far
							 //   * bestScore:       the score of the best state
							 //   * currentTemp:     the current temperature
							 //   * totalElapsed:      number of seconds elapsed overall
							 //   * totalVariations:   number of variations created overall
							 //   * roundNumber:     the current round (rounds are reset-and-start-from-best)
							 //   * roundElapsed:    number of seconds elapsed in this round
							 //   * roundVariations: number of variations created this round
} = {}) {
	const runStart = Date.now() / 1000
	let roundStart = runStart

	// Save the unchanged values for calculating progress
	const specifiedStopAfterTime = stopAfterTime
	const specifiedStopAfterVariations = stopAfterVariations
	const specifiedStopAfterRounds = stopAfterRounds
	const specifiedStopAfterScore = stopAfterScore

	const tempBasedOnTime = !!tempFalloffTime
	const tempScale = 100 / (tempBasedOnTime ? tempFalloffTime : tempFalloffVariations)
	stopAfterTime = stopAfterTime || Infinity
	stopAfterVariations = stopAfterVariations || Infinity
	stopAfterScore = stopAfterScore!==undefined ? stopAfterScore : -Infinity
	stopAfterRounds = stopAfterRounds || Infinity

	const status = {
		currentTemp: tempStart,
		roundNumber: 1,
		totalVariations: 0,
		roundVariations: 0,
	}
	let prevState = initialState ? dup(initialState) : initial()
	status.currentState = status.bestState = dup(prevState)
	let prevScore = status.currentScore = status.bestScore = measure.call(prevState, prevState)
	const startingScore = prevScore.score

	let nextCheckinTime  = runStart + checkinAfterTime
	let nextCheckinScore = prevScore.score - checkinAfterScore

	do {
		const now = Date.now() / 1000
		status.totalVariations++
		status.roundVariations++
		status.totalElapsed = now - runStart
		status.roundElapsed = now - roundStart

		if (checkin && (now>=nextCheckinTime || (status.totalVariations%checkinAfterVariations===0) || status.currentScore.score<=nextCheckinScore)) {
			status.roundProgress = restartAfterTime       ? status.roundElapsed/restartAfterTime :
			                       restartAfterVariations ? status.roundVariations/restartAfterVariations :
			                       // TODO: restart after temperature
			                       // TODO: restart after score
			                       undefined
			status.totalProgress = specifiedStopAfterTime       ? status.totalElapsed/specifiedStopAfterTime :
			                       specifiedStopAfterVariations ? status.totalVariations/specifiedStopAfterVariations :
			                       specifiedStopAfterRounds     ? (status.roundNumber-1)/specifiedStopAfterRounds :
			                       specifiedStopAfterScore      ? (status.currentScore.score-startingScore) / (specifiedStopAfterScore-startingScore) :
			                       undefined
			// console.log('totalProgress', status.totalProgress, {specifiedStopAfterTime, specifiedStopAfterVariations, specifiedStopAfterRounds, specifiedStopAfterScore}, status)
			nextCheckinTime += checkinAfterTime
			nextCheckinScore -= checkinAfterScore
			checkin(status)
		}

		// console.log(`[${[status.totalVariations,status.roundNumber,status.currentState, status.currentScore.score, status.bestState, status.bestScore.score, status.currentTemp].join(',')}],`)

		if (restartAfterTemperature) status.currentTemp = tempStart / (tempScale * (tempBasedOnTime ? status.roundElapsed : status.roundVariations) + 1)

		// Comparisons with undefined will always return false, and the next restart parameter will be tried
		if (status.roundElapsed>=restartAfterTime || status.roundVariations>=restartAfterVariations || (status.bestScore.score<restartAfterScore && status.currentScore.score>=restartAfterScore) || (status.currentTemp<=restartAfterTemperature)) {
			prevState = dup(status.bestState)
			status.currentState = dup(status.bestState)
			prevScore = status.currentScore = status.bestScore
			status.roundNumber++
			status.roundVariations = 0
			roundStart = now
		} else {
			status.currentState = vary.call(prevState, prevState)
			status.currentScore = measure.call(status.currentState, status.currentState)
			const deltaScore = status.currentScore.score - prevScore.score
			let useThisState = deltaScore<0
			if (!useThisState) {
				if (!restartAfterTemperature) status.currentTemp = tempStart / (tempScale * (tempBasedOnTime ? status.roundElapsed : status.roundVariations) + 1)
				useThisState = Math.random() <= Math.exp(-deltaScore/status.currentTemp)
			} else if (status.currentScore.score <= status.bestScore.score) {
				status.bestState = dup(status.currentState)
				status.bestScore = status.currentScore
			}
			if (useThisState) {
				prevState = status.currentState
				prevScore = status.currentScore
			}
		}
	} while (
		status.bestScore.score>stopAfterScore &&
		status.totalElapsed<stopAfterTime &&
		status.totalVariations<stopAfterVariations &&
		status.roundNumber<=stopAfterRounds
	)

	const elapsed = Date.now() / 1000 - runStart;
	const results = {bestState:status.bestState, bestScore:status.bestScore, elapsed, variations:status.totalVariations, rounds:status.roundNumber, roundProgress:1, totalProgress:1};
	return results;

	function dup(state) { return clone ? clone.call(state, state) : state }
}
