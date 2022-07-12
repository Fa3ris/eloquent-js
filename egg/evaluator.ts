import { ApplyExpression, Expression, parse, ValueExpression, WordExpression } from "./parser";


type Scope = { [key: string]: EvaluationResult}

type EvaluationResult = string | number | Function

type KeywordFunctions = {[key: string]: KeywordFunction }

type KeywordFunction = (args: Expression[], scope: Scope) => EvaluationResult
const keywordFunctions: KeywordFunctions = {}

keywordFunctions['if'] = () => 10
keywordFunctions['while'] = () => 20
keywordFunctions['do'] = () => 30
keywordFunctions['define'] = () => 40

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


function evaluate(s: string): EvaluationResult {
    const scope: Scope = {}
    scope['x'] = 10
    return evaluateExpression(parse(s), scope)
}


// ----- TEST ------

if (require.main === module) // if was called via node and not reported
for (let p of ['123', '"hello"', '"hello"    ', '"fefefe', 'x', 'y', 'if(>(x, 2), 1, 2)',
'while(>(x, 2), 1, 2)', 'do(>(x, 2), 1, 2)', 'define(>(x, 2), 1, 2)' ]) {

    try {
        console.dir(evaluate(p), {depth: null})
    } catch (err) {
        console.error((err as SyntaxError).message)
    }
}

