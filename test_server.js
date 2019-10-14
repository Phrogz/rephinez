const HTTP = require('http')

const fork = require('child_process').fork;
const program = require('path').resolve('test_child.js');
const child = fork(program, [], {stdio:['inherit', 'inherit', 'inherit', 'ipc']});

let current = '(no message received yet)'
child.on('message', msg=>{
    console.log('received', msg)
    current=msg
})

HTTP.createServer(function (req, res) {
    if (req.url=='/') {
        res.writeHead(200, {'Content-Type': 'text/plain'})
        res.write(current)
        res.end();
    } else if (req.url=='/poke') {
        console.log('poking child')
        child.send('poke!')
    } else if (req.url=='/die') {
        console.log('killing child')
        child.send('die')
    }
}).listen(8080);
