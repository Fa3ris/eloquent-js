import chalk from 'chalk';

import {readFile, writeFile} from 'fs'

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
