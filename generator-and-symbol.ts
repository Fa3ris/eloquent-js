// Symbols are unique

import assert from "assert";


assert(Symbol('a') !== Symbol('a'))


const toStringSymbol = Symbol('toString')

console.log(toStringSymbol);

(Array.prototype as any)[toStringSymbol] = function() {
    return `array is ${this.length} entries long`
}

const myArr = [1, 2]
console.log(myArr.toString())
console.log((myArr as any)[toStringSymbol]())


const lengthSymbol = Symbol('length')

const simpleString = {
    // define function associated to symbol
    [toStringSymbol]() {
        return 'I am a simple string ' + this[lengthSymbol]
    },

    [lengthSymbol]: 10
}

console.log(simpleString[toStringSymbol]())

simpleString[lengthSymbol] = 22
console.log(simpleString[toStringSymbol]())


// ITERATOR AND SYMBOL

console.log(Symbol.iterator)

const iterable = [3, 2, 1]

console.log(iterable[Symbol.iterator])

// always return new iterator
console.log(iterable[Symbol.iterator]().next()) // 3
console.log(iterable[Symbol.iterator]().next()) // 3
console.log(iterable[Symbol.iterator]().next()) // 3

process.stdout.write('\n\n')

const iterator = iterable[Symbol.iterator]()
console.log(iterator.next())
console.log(iterator.next())
console.log(iterator.next())
console.log(iterator.next())
console.log(iterator.return?.())
console.log(iterator.throw?.())

/* 
    will print

    { value: 3, done: false }
    { value: 2, done: false }
    { value: 1, done: false }
    { value: undefined, done: true }
    undefined
    undefined
*/


for (let char of 'a string') { // String implements Iterable
    process.stdout.write(char)
}
process.stdout.write('\n')


class Path implements Iterable<string> {

    private _steps: string[]
    constructor(steps: string[]) {
        this._steps = steps
    }

    get length() {return this._steps.length}
    step(i: number) { return this._steps[i] }

    [Symbol.iterator](): Iterator<string, any, undefined> {
        return new PathIterator(this)
    }
}

const pathToMaster = new Path(['beginner', 'intermediate', 'senior', 'master'])

class PathIterator implements Iterator<string> {

    private _path: Path
    private _index = 0
    constructor(path: Path) {
        this._path = path
    }

    next(...args: [] | [undefined]): IteratorResult<string, any> {
        if (this._index >= this._path.length) {
            return {value: undefined, done: true}
        }
        return {
            value: this._path.step(this._index++),
            done: false
        }
    }
}

for (let step of pathToMaster) {
    console.log(step)
}


// exercise

// naive implementation of Set of number
class Group implements Iterable<number> {

    [Symbol.iterator](): Iterator<number, any, undefined> {
        // could also pass a copy of the values to iterator
        // to avoid conflict if Group is updated while iterating
        return new GroupIterator(this)
    }

    private _arr: number[] = [] 
    has(n: number): boolean {
        return this._arr.includes(n)
    }

    add(n: number) {
        if (!this._arr.includes(n)) {
            this._arr.push(n)
        }
    }

    get size() {
        return this._arr.length
    }

    val(i: number) {
        return this._arr[i]
    }

    delete(n: number) {
        const i = this._arr.findIndex(val => val === n);
        this._arr.splice(i, 1)
    }

    static from(it: Iterable<number>): Group {
        const res = new Group();
        for (let v of it) {
            res.add(v)
        }
        return res
    }
}

class GroupIterator implements Iterator<number> {

    private _group: Group
    private _index = 0
    
    constructor(_group: Group) {
        this._group = _group
    }

    next(...args: [] | [undefined]): IteratorResult<number, any> {
        if (this._index >= this._group.size) {
            return {value: undefined, done: true}
        }
        return {
            value: this._group.val(this._index++),
            done: false
        }
    }

}

let group = Group.from([10, 20]);
console.log(group.has(10));
// → true
console.log(group.has(30));
// → false
group.add(10);
group.delete(10);
console.log(group.has(10));
// → false

for (let value of Group.from([100, -33, 50, 100])) {
    console.log(value);
}



// conflict can occur if update while iterating
const updatingGroup = Group.from([100, -33, 50, 100])
let val = 200; 
for (let value of updatingGroup) {
    console.log(value);
    if (val < 500)
    updatingGroup.add(val++)
}


process.stdout.write(
`*****************************************
                GENERATOR
*****************************************\n\n
`)

function* heroes(): Generator<string> {
    
    yield 'all might'
    yield 'luffy'
    // implicit return
}

const gen = heroes()


console.log(gen.next())
console.log(gen.next())
console.log(gen.next())

class HeroesDB implements Iterable<string> {

    private _values = ['toto', 'titi', 'law', 'zoro'];

    [Symbol.iterator](): Generator<string> {

        return this.generator()
    }

    private *generator(): Generator<string> {
        for (let v of this._values) {
            yield v
        }
    }

}
for (let h of new HeroesDB()) {

    console.log(h)
}