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
Object.freeze(topScope)


function evaluate(s: string): EvaluationResult {
    const scope: Scope = Object.create(topScope)
    // scope['x'] = 10
    return evaluateExpression(parse(s), scope)
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
    ` // 55
]) {

    console.log('evaluate expression ' + p.replace(/(?:\r\n|\r|\n|\s{2,})/g, ''))
    try {
        console.dir(evaluate(p), {depth: null})
    } catch (err) {
        console.error((err as SyntaxError).message)
    }
}

