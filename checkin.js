// A function to be invoked every so often (see checkinEvery in config.js)
// Will be passed the following ordered parameters:
//   * The current state
//   * The energy/stats of the current state
//   * The best state
//   * The energy/stats of the best state
//   * The current temperature
//   * The current number of iterations elapsed
//   * The current elapsed number of seconds
module.exports = function checkin({currentState,currentScore,bestState,bestScore,currentTemp,runElapsed,runVariations,roundNumber,roundElapsed,roundVariations}={}) {
    const currentStateWidth = 80
    let header = `SCORE:${currentScore.score.toFixed(2)}`
    const elapsed = runElapsed>3600 ? `${(runElapsed/3600).toFixed(1)}H` : runElapsed>600 ? `${(runElapsed/60).toFixed(0)}m` : runElapsed>59.5 ? `${(runElapsed/60).toFixed(1)}m` : runElapsed>9.5 ? `${runElapsed.toFixed(0)}s` : `${runElapsed.toFixed(1)}s`
    if (roundNumber) header += `  round:${roundNumber}  ${runVariations} variations in ${elapsed}  (${(runVariations/runElapsed).toFixed(0)}/sec)  ${currentTemp.toFixed(2)}°`
    if (bestScore) header = elide(header, currentStateWidth) + ` | BEST SCORE:${bestScore.score.toFixed(2)}`
    console.log(header)

    const nameLength = Math.max.apply(Math, [...Object.keys(currentScore.scores), ...Object.keys(currentScore.stats)].map(n=>n.length))
    for (const name in currentScore.scores) {
        let line = `  ${name.padEnd(nameLength, ' ')} : ${currentScore.scores[name].toFixed(2)}`
        if (bestScore) line = elide(line, currentStateWidth) + ` | ${bestScore.scores[name].toFixed(2)}`
        console.log(line)
    }
    for (const name in currentScore.stats) {
        let line = `  ${name.padEnd(nameLength, ' ')} : ${currentScore.stats[name]}`
        if (bestScore) line = elide(line, currentStateWidth) + ` | ${bestScore.stats[name]}`
        console.log(line)
    }
    console.log()
}

function elide(str, len) {
    if (str.length>len) {
        const re = new RegExp('^(.{' + (len-1) + '})[\\d\\D]+')
        return str.replace(re, '$1…')
    } else return str.padEnd(len, ' ')
}