const {abbreviate:short} = require('./utils')

// A function to be invoked every so often (see checkinEvery in config.js)
// Will be passed the following parameters:
//   * The current state
//   * The energy/stats of the current state
//   * The best state
//   * The energy/stats of the best state
//   * The current temperature
//   * The current number of iterations elapsed
//   * The current elapsed number of seconds
module.exports = function checkin({currentState,currentScore,bestState,bestScore,currentTemp,totalElapsed,totalVariations,roundNumber,roundElapsed,roundVariations}={}) {
    const currentStateWidth = 70
    let header = `SCORE:${currentScore.score.toFixed(2)}`
    const elapsed = totalElapsed>3600 ? `${(totalElapsed/3600).toFixed(1)}H` : totalElapsed>600 ? `${(totalElapsed/60).toFixed(0)}m` : totalElapsed>59.5 ? `${(totalElapsed/60).toFixed(1)}m` : totalElapsed>9.5 ? `${totalElapsed.toFixed(0)}s` : `${totalElapsed.toFixed(1)}s`
    if (roundNumber) header += `  round:${short(roundNumber)}  ${short(totalVariations)} variations in ${elapsed} (${short(totalVariations/totalElapsed)}/s)  ${short(currentTemp,2)}°`
    if (bestScore) header = elide(header, currentStateWidth) + ` | BEST SCORE:${short(bestScore.score,2)}`
    console.log(header)

    const nameLength = Math.max.apply(Math, [...Object.keys(currentScore.scores), ...Object.keys(currentScore.stats)].map(n=>n.length))
    for (const name in currentScore.scores) {
        let line = `  ${name.padEnd(nameLength, ' ')} : ${short(currentScore.scores[name].weighted,2)}`
        if (bestScore) line = elide(line, currentStateWidth) + ` | ${short(bestScore.scores[name].weighted,2)}`
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