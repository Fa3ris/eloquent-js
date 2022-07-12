import { ApplyExpression, Expression, parse, ValueExpression, WordExpression } from "./parser";

/* 
    Terminology: expression vs statement

    an “expression” is a combination of values and functions 
    that are combined and interpreted by the compiler to create a new value, 
    
    as opposed to a “statement” which is just a standalone unit of execution and doesn’t return anything.
    
    One way to think of this is that the purpose of
    an expression is to create a value (with some possible side-effects), 
    
    while the sole purpose of a statement is to have side-effects.

*/

type Scope = { [key: string]: EvaluationResult}

type EvaluationResult = string | number | boolean | Function

type KeywordFunctions = {[key: string]: KeywordFunction }

type KeywordFunction = (args: Expression[], scope: Scope) => EvaluationResult
const keywordFunctions: KeywordFunctions = {}

keywordFunctions['if'] = (args: Expression[], scope: Scope) => {

    if (!args || args.length != 3) { throw SyntaxError("'if' expression requires 3 arguments but got " + (args? args.length : 0)) }

    if (evaluateExpression(args[0], scope) !== false) {
        return evaluateExpression(args[1], scope)
    } else {
        return evaluateExpression(args[2], scope)
    }
}
keywordFunctions['while'] = (args: Expression[], scope: Scope) => {
    if (!args || args.length != 2) { throw SyntaxError("'while' expression requires 2 arguments but got " + (args? args.length : 0)) }
    
    while(evaluateExpression(args[0], scope) !== false) {
        evaluateExpression(args[1], scope)
    }

    return false
}
keywordFunctions['do'] = (args: Expression[], scope: Scope) =>{ 
    
    let lastEvaluation: EvaluationResult = false

    for (let arg of args) {
        lastEvaluation = evaluateExpression(arg, scope)
    }

    return lastEvaluation 
}
keywordFunctions['define'] = (args: Expression[], scope: Scope) => {
    if (args.length != 2 || args[0].type != 'word') {
        throw new SyntaxError("'define' requires 2 args but got " + args.length)
    }

    const value = evaluateExpression(args[1], scope)

    scope[args[0].value] = value
    return value
 }

 keywordFunctions['fun'] = (args: Expression[], scope: Scope) => {
    if (!args.length) {
        throw new SyntaxError("'fun' requires a body")
    }

    const body = args[args.length - 1]
    const params = args.slice(0, args.length - 1).map(arg => {
        if (arg.type !== 'word') {
            throw new SyntaxError("parameter must be a word but got " + arg);
            
        }
        return arg.value
    })

    const funDef = function() {
        // cannot use arrow function definition to access arguments object
        if (arguments.length != params.length) {
            throw new TypeError("function expected " + params.length + " args but got " + arguments.length);
        } 
        const localScope: Scope = Object.create(scope)

        for (let i = 0; i < params.length; i++) {
            localScope[params[i]] = arguments[i]
        }
        return evaluateExpression(body, localScope)
    }

    return funDef
 }


 Object.freeze(keywordFunctions)

function evaluateExpression(expression: Expression, scope: Scope): EvaluationResult {

    if (expression.type === "value") {
        return (expression as ValueExpression).value
    }

    if (expression.type === 'word') {
      const binding = (expression as WordExpression).value
      if (binding in scope) {
        return scope[binding]
      }
       throw new ReferenceError(binding  + " not in scope");
    }

    if (expression.type === 'apply') {
        const {operator, args} = (expression as ApplyExpression)

        // keywords: if, while, do, define
        if (operator.type === 'word' && ((operator as WordExpression).value in keywordFunctions)) {
            return keywordFunctions[(operator as WordExpression).value](args, scope)
        }

        const operatorToApply = evaluateExpression(operator, scope)

        // else apply defined function call
        if (typeof operatorToApply === 'function') {
            // ... = spread operator: affects each item to a parameter of the function
            return operatorToApply(...args.map(arg => evaluateExpression(arg, scope)))
        }

        throw new TypeError("not a function: " + operatorToApply);
        
    }

    return 0
}

const topScope: Scope = {}

topScope['false'] = false;
topScope['true'] = true;

for (let operation of ['+', '-', '*', '/', '==', "<", ">"]) {
    topScope[operation] = Function('a', 'b', `return a ${operation} b`)
}

topScope['print'] = (a: any) => { console.log(a); return a }

topScope['array'] = (...values: any[]) => {
    return new Array(...values)
}

topScope['length'] = (array: any[]) => { return array.length }

topScope['element'] = (array: any[], i: number) => { return array[i] }

Object.freeze(topScope)


function evaluate(s: string): EvaluationResult {
    return evaluateExpression(parse(s), Object.create(topScope))
}


// ----- TEST ------

if (require.main === module) // if was called via node and not reported
for (let p of ['123', '"hello"', '"hello"    ', '"fefefe', 'x', 'y', 

'if(10, 1, 2)',
'if (0, 1, 2)',
'if(>(x, 2), 1, 2)',
'while(false, 1)',
'do(>(x, 2), 1, 2)',
'define(>(x, 2), 1, 2)',
'define(toto, 1)',
'do(define(toto, false), toto)',
'if (true, false, "")',
`if (
    >(3, 0),
    "yes", "no")`,

    `
    do(define(total, 0),
       define(count, 1),
       while(<(count, 11),
             do(define(total, +(total, count)),
                define(count, +(count, 1)))),
       print(total))
    `, // 55
    `
    do(define(plusOne, fun(a, +(a, 1))),
       print(plusOne(10)))
    `, // 11


    `
do(define(pow, fun(base, exp,
     if(==(exp, 0),
        1,
        *(base, pow(base, -(exp, 1)))))),
   print(pow(2, 10)))
`, // 1024

// cannot use keyword 'array'
`
do(define(sum, fun(arr,
     do(define(i, 0),
        define(sum, 0),
        while(<(i, length(arr)),
          do(define(sum, +(sum, element(arr, i))),
             define(i, +(i, 1)))),
        sum))),
   print(sum(array(1, 2, 3))))
` // 6
]) {

    console.log('evaluate expression ' + p.replace(/(?:\r\n|\r|\n|\s{2,})/g, ''))
    try {
        console.dir(evaluate(p), {depth: null})
    } catch (err) {
        console.trace((err as SyntaxError).message)
    }
}

