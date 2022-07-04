import { copyFileSync, readdirSync, mkdirSync, accessSync, rmSync } from "fs";


try {
    // readdirSync('build')
    accessSync('build')
    console.log('build dir already exists')
} catch (e) {
    console.log('create build dir')
    mkdirSync('build')
}

console.log(readdirSync('.'))

const tgzPattern = /.tgz$/

const filenamesToCopy: string[] = []
for (let name of readdirSync('.')) {
    if (tgzPattern.test(name)) {
        console.log(`${name} matches`)
        filenamesToCopy.push(name)
    }
}

for (let name of filenamesToCopy) {
    console.log('copy', name, 'to', 'build/' + name)
    copyFileSync(name, 'build/' + name)
    console.log(name, 'copied')
    console.log('delete', name)
    rmSync(name)
    console.log(name, 'deleted')
}