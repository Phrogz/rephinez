const fs = require('fs')
const path = require('path')
const annealer = require('./lib/annealer')
const checkinConsole = require('./lib/checkinConsole')
const {abbreviate:short} = require('./lib/utils')
let yardsticks

if (process.send) {
	process.on('message', message => {
		console.log('main.js got request for:', message.action)
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
	let html = activeScenario.html && activeScenario.html.call(activeScenario.initialState, activeScenario.initialState)
	process.send({
		action:'resetResponse',
		data:{
			bestStateHTML:html,
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

		const message = {action:'update', data:Object.assign({}, status)}
		// message.data.currentStateHTML = activeScenario.html && status.currentState && activeScenario.html.call(status.currentState, status.currentState)
		message.data.bestStateHTML    = activeScenario.html && status.bestState    && activeScenario.html.call(status.bestState, status.bestState)

		// Shrink our payload
		delete message.data.bestState
		delete message.data.currentState
		delete message.data.currentScore

		process.send(message)
	}
	console.log('starting annealing')
	const status = optimize(activeScenario, webCheckin)

	const message = {action:'update', data:Object.assign({}, status)}
	message.data.final = true
	if (activeScenario.html) message.data.bestStateHTML = activeScenario.html.call(status.bestState, status.bestState)

	// Shrink our payload
	delete message.data.bestState
	delete message.data.currentState

	process.send(message)

	// Save our best state as where we might pickup later
	activeScenario.initialState = activeScenario.clone ? activeScenario.clone.call(status.bestState, status.bestState) : status.bestState

	if (activeScenario.save) exportState(activeScenario.save, status.bestState, scenarioName)
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
		let score = 0
		let stats = {}
		const weight = scenario.yardsticks[name]
		if (weight) {
			let {score:scoreResult, stats:statsResult} = yardsticks[name](state)
			score = scoreResult
			stats = statsResult
		}
		result.scores[name] = {raw:score, weighted:score*weight}
		result.score += score * weight
		Object.assign(result.stats, stats)
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

function changeWeight(scenarioName, yardstickName, newWeight) {
	const stick = activeScenario.yardsticks[yardstickName]
	console.log('changing weight for', yardstickName, stick, 'to', newWeight)
	activeScenario.yardsticks[yardstickName] = newWeight
	// TODO: validate that the activeScenario is the scenarioName
	process.send({action:'weightResponse', data:{bestScore:measure(activeScenario, activeScenario.initialState)}})
}