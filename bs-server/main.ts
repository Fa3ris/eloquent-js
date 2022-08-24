import chalk from 'chalk';

import {readFile, writeFile, createReadStream} from 'fs'

import { promises as fsPromises } from 'fs';

const readdirPromise = fsPromises.readdir
const statPromise = fsPromises.stat

import * as PATH from 'path'

import {createServer, IncomingMessage, request} from 'http'

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


const httpActionHandlers: { [key: string]: (req: IncomingMessage) => any } = {}


httpActionHandlers['GET'] = getFile

async function getFile(request: IncomingMessage) {

    const url = new URL(request.url || '', `http://${request.headers.host}`);

    console.log('url searched', url.pathname, 'params', url.searchParams)
    console.log('decoded path', decodeURIComponent(url.pathname),)
    
    const path = decodeURIComponent(url.pathname).slice(1)

    const absolutePath = PATH.resolve('out' + PATH.sep + path)
    console.log(absolutePath, process.cwd())
    const relative = PATH.relative(process.cwd() + PATH.sep + 'out', absolutePath)
    console.log('relative', relative);

    if (!relative) {
        console.error('forbid access to', absolutePath)
        return {
            status: 403,
            body: 'forbidden',
            type: 'text/plain'
        }
    }
    let stats;
    try {
        stats = await statPromise(absolutePath, {
        })
    } catch (error) {
        console.error('file does not exists', error)
        return {
            status: 404,
            body: 'not found [' + path + ']',
            type: 'text/html'
        }
    }
    
    if (stats.isFile()) {
        return {
            body: createReadStream(absolutePath),
            type: 'text/html'
        }
    } else {
        return {
            body: (await readdirPromise(absolutePath)).join('\n'),
            type: 'text/plain'
        }
    }
       
    
}

async function notAllowed(request: IncomingMessage) {

    return {
        status: 405,
        body: `method ${request.method} is not supported`
    }
}

createServer((req, res) => {

    const handler = httpActionHandlers[req.method as string] || notAllowed

    handler(req).catch((err: any) => {
        console.error(err)
        return err
    }).
    
    then(({ body, status = 200, type = "text/plain"} : {body: any, status: number, type: string}): void => {
        if (typeof body === 'string') console.log(body)
        if (body && body.pipe) {
            body.on('end', () => {
                res.writeHead(status, {"Content-Type": type})
            })
            body.on('error', (err: any) => {
                console.error(err)
                res.writeHead(500, {"Content-Type": type})
                res.end('error')
            })
            body.pipe(res)
        }
        else { 
            res.writeHead(status, {"Content-Type": type})
            res.end(body)
        }
    })
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