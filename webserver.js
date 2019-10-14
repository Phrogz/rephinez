const HTTP = require('http')

const fork    = require('child_process').fork
const program = require('path').resolve('main.js')
const worker  = fork(program, [], {stdio:['inherit', 'inherit', 'inherit', 'ipc']})

const scenarioURL = new RegExp('/yardsticks/(?<name>[^/?#]+)')
HTTP.createServer(function (req, res) {
	let match
	if (req.url=='/') {
		renderHome(res);
	} else if (req.url=='/scenarios') {
		sendScenarios(res);
	} else if (req.url=='/stop') {
		abortRun(res);
	} else if (match = scenarioURL.exec(req.url)) {
		sendYardsticks(res, match.groups.name)
	} else {
		console.log('Did not handle', req.url)
	}
	res.end();
}).listen(8080);

function renderHome(res) {
	res.writeHead(200, {'Content-Type': 'text/html'})
	res.write(require('fs').readFileSync('home.html', 'utf8'))
}

function sendScenarios(res) {
	res.writeHead(200, {'Content-Type': 'application/json'})
	res.write('["a", "boo", "radley"]')
}

function abortRun() {

}

function sendYardsticks(res, scenario) {
	console.log('looking for yardsticks for', scenario)
	res.writeHead(200, {'Content-Type': 'application/json'})
	const yardsticks = [
		{name:'doubleheaders', weight:10},
		{name:'tripleheaders', weight:0},
		{name:'gamegaps',      weight:0},
	]
	res.write(JSON.stringify(yardsticks))
}