import chalk from 'chalk';

import {readFile, writeFile} from 'fs'

import {createServer, request} from 'http'

console.log(chalk.blue('Hello server!'));
console.log('args are', chalk.blue(process.argv));

console.log('current working dir', process.cwd())

readFile("out/toot.txt", 'utf-8', (err, data) => {
    if (err) {
        throw err
    }
    console.log("content:", data)
})

writeFile('out/msg.txt', 'sending msg', { 
    encoding: 'utf-8',

    flag: 'a'},  (err) => {
    console.log('write error', err)
})

createServer((req, res) => {

    res.writeHead(200, {'Content-Type': "text/html"})
    res.write('<h1>Hello from server</h1>')
    res.write(`<p>url requested: <b>${req.url}<b></p>`)
    res.end()

}).listen(8080)


request({

    host: 'eloquentjavascript.net',
    path: '/20_node.html',
    method: 'GET',
    headers: {Accept: 'text/html'},
},

res => {

    console.log('status', res.statusCode)
    res.on('data', (data) => {
        console.log('data received', data, String(data))
    })

    res.on('readable', () => {
        console.log('stream is readable', res.read())
    })

    res.on('close', () => {
        console.log('close stream')
    })

    res.on('end', () => {
        console.log('end stream')
    })

} ).end()