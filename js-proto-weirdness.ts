import assert from "assert";

process.stdout.write(
`*****************************************
                THIS
*****************************************\n\n
`)

// declared function has its own `this` binding, whose value depends on how it is called: f(), call(), apply(), bind()
// this is here to help typescript compiler, will be removed from transpiled JS
function drive(this: {at: string}, to: string) {
    console.log('drive from', this.at, 'to', to);
    this.at = to
    console.log(this)
}

const driverA = {
    at: 'black wood',
    drive
}

driverA.drive('white lake')


const driverB = {
    at: 'sky high',
    drive
}

driverB.drive('deep hell')

drive.call(driverB, 'burning volcano')
drive.apply(driverB, ['dry desert'])


// arrow function does not have its own `this`, but use the `this` of the surrounding scope

function threshold(this: any) {
    const that = this;
    console.log(this)
    const res = this.values.filter((val: number) => { 
        assert(this === that, '`this` corresponds to the surrounding `this` in arrow function')
        return val > this.threshold})
    console.log(res)
}

threshold.call({values: [1, 4, 6, 2, 7], threshold: 3}) // [ 4, 6, 7 ]


process.stdout.write(
`*****************************************
                PROTOTYPE
*****************************************\n\n
`)

try {
    
    Object.getPrototypeOf(null)
} catch (error) {
    console.error('no prototype for null')
}

try {
    
    Object.getPrototypeOf(undefined)
} catch (error) {
    console.error('no prototype for undefined')
}

    
const objProto = Object.getPrototypeOf({})

assert(objProto === Object.prototype)
    
// Function
assert(Object.getPrototypeOf(drive) === Function.prototype)
// Array
assert(Object.getPrototypeOf([]) === Array.prototype)
assert(Object.getPrototypeOf(Object.getPrototypeOf([])) === Object.prototype)


console.log('gets weird HERE')

const BookProto = {

    genre: undefined,
    title: undefined,
    description() {
        console.log(`this book is of genre [${this.genre}] and title is [${this.title}]`)
    }

}

const book1 = Object.create(BookProto)

book1.genre = 'adventure'
book1.title = 'into the field'

book1.description()

const book2 = Object.create(BookProto)

book2.genre = 'fight'
book2.title = 'KO'

book2.description()

const book3 = Object.create(book2)

book3.title = 'Boxer'
book3.description()


// informal constructor

function makeBook(genre: string, title: string) {
    const instance = Object.create(BookProto)
    instance.genre = genre
    instance.title = title
    return instance
}

makeBook('romance', 'do not forget').description()


// constructor function
// all Function objects have a prototype property that we can use to set common properties/methods
// this prototype property is the one used to define the prototype of instances 
// created by constructor functions when called with the `new` operator
BookCtr.prototype.description = function() {
    console.log(`ctr function prototype - this book is of genre [${this.genre}] and title is [${this.title}]`)
}

function BookCtr(this: any, genre: string, title: string) {
    this.genre = genre
    this.title = title
}

// cast as any because of TS compile error - prefer using class declarations !!!
new (BookCtr as any)('slice of life', 'days').description()

const book4 = new (BookCtr as any)('slice of life', 'days')

console.log('book 4 proto', Object.getPrototypeOf(book4))


const specialBook = new (BookCtr as any)('detective', 'elementary')

// override the function defined in BookCtr.prototype
specialBook.description = function() {
    console.log('special description'.toUpperCase(), this.genre, this.title)
}

specialBook.description() // SPECIAL DESCRIPTION elementary detective

const myArr = [1, 2, 3]

console.log('Object toString', Object.prototype.toString.call(myArr)) // [object Array]
console.log('Array toString', Array.prototype.toString.call(myArr)) // 1,2,3


// polymorphism
function EuroBill(this: any, value: number) {
    this.value = value
}

const tenBill = new (EuroBill as any)(10);

// String() calls toString()
console.log('default toString', String(tenBill))
EuroBill.prototype.toString = function() {
    return `${this.value}€`
}

console.log('custom toString', String(tenBill))


// `in` operator vs hasOwnProperty()
// `in` checks in current object and prototype chain, hasOwnProperty checks only the object

const objectParent = {
    hello : 'Bonjour'
}

const objectToCheck = Object.create(objectParent)

objectToCheck['bye'] = "Au revoir"


console.log("'hello' in objectToCheck", 'hello' in objectToCheck)
console.log("'bye' in objectToCheck",'bye' in objectToCheck)
console.log("objectToCheck.hasOwnProperty('hello')", objectToCheck.hasOwnProperty('hello'))
console.log("objectToCheck.hasOwnProperty('bye')", objectToCheck.hasOwnProperty('bye'))
console.log("objectToCheck.hasOwnProperty('bye')", eval("objectToCheck.hasOwnProperty('bye')"))



const mapThatOverridesHasOwnProperty = {one: true, two: true, hasOwnProperty: true};

console.log(Object.prototype.hasOwnProperty.call(mapThatOverridesHasOwnProperty, 'one'));
// → true

process.stdout.write(
`*****************************************
                CLASS
*****************************************\n\n
`)

// class expression - who uses this ?

const myAnonymousObj = new class {

    getNumber(): number {
        return Math.floor(Math.random() * 10)
    }
}

console.log(myAnonymousObj.getNumber())