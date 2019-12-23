const PORT = 8080
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
		case 'weightResponse':
			res = responseByMessage.weight
			if (res) {
				res.writeHead(200, {'Content-Type':'application/json'})
				res.end(JSON.stringify(msg.data))
				delete responseByMessage.weight
			}
		break;
		case 'paramResponse':
			res = responseByMessage.param
			if (res) {
				res.writeHead(200, {'Content-Type':'application/json'})
				res.end('true')
				delete responseByMessage.weight
			}
		break;
		case '404':
			res = responseByMessage[msg.field]
			if (res) {
				console.log('404')
				res.writeHead(404, {'Content-Type':'text/plain'})
				res.end(`No action to handle ${msg.field}`)
				delete responseByMessage[msg.field]
			}
			break;
		default:
			console.log(`Unexpected response from worker`, msg)
	}
})

function workerRequest(res, parts) {
	const name = parts.shift()
	if (responseByMessage[name]) responseByMessage[name].end("(superceded)")
	responseByMessage[name] = res
	worker.send({action:name, data:parts})
}

HTTP.createServer(function (req, res) {
	console.log('Request:', unescape(req.url))
	if (req.url==='/') {
		res.writeHead(200, {'Content-Type': 'text/html'})
		res.end(require('fs').readFileSync('lib/home.html', 'utf8'))
	} else if (req.url==='/peek') {
		res.writeHead(200, {'Content-Type':'application/json'})
		res.end(JSON.stringify(lastUpdate))
		if (lastUpdate.final) lastUpdate = {}
	} else {
		const parts = req.url.split('/').map(unescape)
		parts.shift() // Throw away the leading ''
		if (parts[0]=='start') lastUpdate.final = false;
		workerRequest(res, parts)
	}
}).listen(PORT)

console.log(`Listening to http://localhost:${PORT}/`)
