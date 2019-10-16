const HTTP = require('http')

const fork    = require('child_process').fork
const program = require('path').resolve('main.js')
const worker  = fork(program, [], {stdio:['inherit', 'inherit', 'inherit', 'ipc']})

let lastUpdate = {}
let responseByMessage = {}
worker.on('message', msg => {
	let res
	switch (msg.action) {
		case 'scenarios':
			res = responseByMessage.scenarios
			if (res) {
				res.writeHead(200, {'Content-Type':'application/json'})
				res.end(JSON.stringify(msg.data))
				delete responseByMessage.scenarios
			}
		break;
		case 'resetResponse':
			res = responseByMessage.reset
			if (res) {
				res.writeHead(200, {'Content-Type':'application/json'})
				res.end(JSON.stringify(msg.data))
				delete responseByMessage.reset
			}
		break;
		case 'start':
			if (responseByMessage.start) {
				responseByMessage.start.writeHead(200, {'Content-Type':'application/json'})
				responseByMessage.start.end('true')
				delete responseByMessage.start
			}
		break;
		case 'update':
			lastUpdate = msg.data;
		break;
		default:
			console.log(`Unexpected response from worker '${msg.action}'`)
	}
})

function workerRequest(name, res, fields={}) {
	if (responseByMessage[name]) responseByMessage[name].end()
	responseByMessage[name] = res
	Object.assign(fields, {action:name})
	worker.send(fields)
}

const scenarioURLs = new RegExp('/(?<action>[^/?#]+)/(?<name>[^/?#]+)')
HTTP.createServer(function (req, res) {
	if (req.url=='/') renderHome(res);
	else if (req.url=='/scenarios') workerRequest('scenarios', res)
	else if (req.url=='/peek') {
		res.writeHead(200, {'Content-Type':'application/json'})
		res.end(JSON.stringify(lastUpdate))
} else {
		const match = scenarioURLs.exec(req.url)
		if (match) workerRequest(match.groups.action, res, {scenario:match.groups.name})
		else console.log('Web server did not handle', req.url)
	}
}).listen(8080);

function renderHome(res) {
	res.writeHead(200, {'Content-Type': 'text/html'})
	res.end(require('fs').readFileSync('lib/home.html', 'utf8'))
}
