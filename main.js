const fs = require('fs')
const path = require('path')
const annealer = require('./lib/annealer')
const checkinConsole = require('./lib/checkinConsole')
const {abbreviate:short} = require('./lib/utils')
let yardsticks

if (process.send) {
	process.on('message', message => {
		switch (message.action) {
			case 'reset':    reset(message.scenario); break;
			case 'start':    optimizeWeb(message.scenario); break;
			case 'weight':   changeWeight(message.scenario, message.yardstick, message.weight); break;
			case 'scenarios':
				process.send({
					action:'scenarios',
					data:fs.readdirSync('./scenarios', {withFileTypes:true})
							 .filter(ent => ent.isDirectory())
							 .map(ent => ent.name)
				})
			break;
			case 'yardsticks':
				// TODO: validate that the message.scenario matches the current scenario
			break;
		}
	})
} else {
	// FIXME: make this command-line driven
	const scenarioName = 'indoor'
	let scenario = reloadScenario(scenarioName)
	let {state:bestState, score:bestScore, elapsed, variations, rounds} = optimize(scenario, checkinConsole)
	console.log(`Tried ${short(variations)} variations in ${short(elapsed,2)}s (${short(variations/elapsed)}/sec), resulting in a score of ${short(bestScore.score,2)}`)
	if (scenario.save) exportState(scenario.save, bestState, scenarioName)
}

let activeScenario

function reset(scenarioName) {
	activeScenario = reloadScenario(scenarioName)
	activeScenario.initialState = activeScenario.initial()
	process.send({
		action:'resetResponse',
		data:{
			bestStateHTML:activeScenario.html && activeScenario.html.call(activeScenario.initialState, activeScenario.initialState),
			bestScore:measure(activeScenario, activeScenario.initialState),
			yardsticks:activeScenario.yardsticks,
		}
	})
}

function optimizeWeb(scenarioName) {
	if (!activeScenario) reset(scenarioName);
	const webCheckin = status => {
		// Save our best state as where we might pickup later
		activeScenario.initialState = activeScenario.clone ? activeScenario.clone.call(status.bestState, status.bestState) : status.bestState

		const message = {action:'update', data:status}
		if (activeScenario.html) {
			status.currentStateHTML = activeScenario.html.call(status.currentState, status.currentState)
			status.bestStateHTML    = activeScenario.html.call(status.bestState, status.bestState)
		}
		process.send(message)
	}
	console.log('starting annealing')
	const result = optimize(activeScenario, webCheckin)

	// Save our best state as where we might pickup later
	activeScenario.initialState = activeScenario.clone ? activeScenario.clone.call(result.bestState, result.bestState) : result.bestState

	const message = {action:'update', data:result}
	if (activeScenario.html) result.bestStateHTML = activeScenario.html.call(result.bestState, result.bestState)
	process.send(message)

	if (activeScenario.save) exportState(activeScenario.save, result.bestState, scenarioName)
}

function reloadScenario(name) {
	const scenarioDir = `./scenarios/${name}`
	if (!fs.existsSync(scenarioDir)) {
		console.error(`Cannot load scenario "${name}" because ${scenarioDir} does not exist`)
	} else {
		// Reset and load the yardsticks
		yardsticks = {}
		const dir = `${scenarioDir}/yardsticks`
		fs.readdirSync(dir).forEach(file => {
			const name = path.basename(file, path.extname(file))
			yardsticks[name] = rerequire(`${dir}/${file}`)
		});

		return rerequire(`${scenarioDir}/scenario`)
	}
}

// Require a file, reloading it from disk each time
function rerequire(path) {
	delete require.cache[require.resolve(path)]
	return require(path)
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

function measure(scenario, state) {
	const result = {score:0, scores:{}, stats:{}}
	for (const name in scenario.yardsticks) {
		const opts = scenario.yardsticks[name]
		if (opts && opts.weight!==0 && yardsticks[name]) {
			let {score, stats} = yardsticks[name](state);
			result.scores[name] = score
			const weight = typeof(opts)==='number' ? opts : (opts.weight || 1)
			score *= weight
			result.score += score * (opts.scale || 1)
			Object.assign(result.stats, stats)
		}
	}
	return result
}

function optimize(scenario, checkin) {
	const options = Object.assign({}, scenario)
	options.checkin = checkin
	options.measure = state => measure(scenario, state)
	return annealer(options);
}

function iso8601Stamp() {
	const now = new Date;
	return [now.getFullYear(), pad(now.getMonth()+1), pad(now.getDate()), 'T', pad(now.getHours()), pad(now.getMinutes()), pad(now.getSeconds())].join('')
	function pad(n) { return (n<10 ? '0' : '')+n }
}
