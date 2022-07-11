import { Expression, parse, ValueExpression } from "./parser";


type Scope = any

type EvaluationResult = string | number

function evaluateExpression(expression: Expression, scope: Scope): EvaluationResult {

    if (expression.type === "value") {
        return (expression as ValueExpression).value
    }

    return 0
}

function evaluate(s: string): EvaluationResult {
    return evaluateExpression(parse(s), {})
}


for (let p of ['123', '"hello"', '"hello"    ', '"fefefe', ]) {

    try {
        const exp = evaluate(p);
        console.log(JSON.stringify(exp, undefined, 1))
    } catch (err) {
        console.error((err as SyntaxError).message)
    }
}

