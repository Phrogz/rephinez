const annealer = require('./annealer')
const fs = require('fs')
const path = require('path')
const checkin = require('./checkin')

let rankings, weights

// FIXME: command-line and UI driven
const scenarioName = 'travellingdiner'

// let scenario = reloadScenario('hatshuffler')
// let scenario = reloadScenario('maxseeker')
let scenario = reloadScenario(scenarioName)
let {state:bestState, score:bestScore, elapsed, variations, rounds} = optimize(scenario)
console.log(`Tried ${variations} variations in ${elapsed.toFixed(2)}s (${(variations/elapsed).toFixed(0)}/sec), resulting in a score of ${bestScore.score.toFixed(2)}`)
if (scenario.save) exportState(scenario.save, bestState, scenarioName)

function reloadScenario(name) {
	const scenarioDir = `./scenarios/${name}`
	if (!fs.existsSync(scenarioDir)) {
		console.error(`Cannot load scenario "${name}" because ${scenarioDir} does not exist`)
	} else {
		// Reset and load the rankings
		rankings = {}
		const rankingDir = `${scenarioDir}/rankings`
		fs.readdirSync(rankingDir).forEach(f => {
			const rankingName = path.basename(f, path.extname(f))
			rankings[rankingName] = rerequire(`${rankingDir}/${f}`)
		});

		return rerequire(`${scenarioDir}/scenario`)
	}
}

// Require a file, reloading it from disk each time
function rerequire(path) {
	delete require.cache[require.resolve(path)]
	return require(path)
}

// Run the rankings in the rankings folder, based on their presence in config.js/weightings
// Weight their scores based on those weightings, and aggregate all the stats they generate
function weightedRankings(state) {
	const result = {score:0, scores:{}, stats:{}};
	let totalWeight=0;
	for (const name in weights) {
		const weight = weights[name];
		if (weight) {
			const {score, stats} = rankings[name](state);
			result.score += score * weight;
			totalWeight += weight;
			result.scores[name] = score;
			Object.assign(result.stats, stats);
		}
	}
	result.score /= totalWeight;
	return result;
}

function exportState(saveƒ, state, scenarioName) {
	const fs = require('fs')
	const {content, type} = saveƒ.call(state, state)
	const directory = `scenarios/${scenarioName}/data`
	const path = `${directory}/state-${iso8601Stamp()}.${type}`
	if (!fs.existsSync(directory)) fs.mkdirSync(directory)
	fs.writeFileSync(path, content)
	console.log(`Wrote ${path}`)
}

function optimize(scenario) {
	const options = Object.assign({}, scenario)
	options.measure = weightedRankings
	options.checkin = checkin
	weights = scenario.weightings
	return annealer(options);
}

function iso8601Stamp() {
	const now = new Date;
	return [now.getFullYear(), pad(now.getMonth()+1), pad(now.getDate()), 'T', pad(now.getHours()), pad(now.getMinutes()), pad(now.getSeconds())].join('')
	function pad(n) { return (n<10 ? '0' : '')+n }
}

