
console.log('🥚 EGG programming language 🐣')


/* 
    Syntax

    do(define(x, 10),
       if(>(x, 5),
            print("large"),
            print("small")
       )
    )

    languages and their grammar ... sniff

    everything is an expression

    expression := binding | number | string | application

    binding := name without space and that is not a keyword
    string := '"' char* '"'
    number := digit*
    application := function call | if | while | do | print



    syntax tree

    >(x, 5) gives

    {
        type: "apply",
        operator: {type: "word", name: ">"},
        args: [
            {type: "word", name: "x"},
            {type: "value", value: 5}
        ]
    }
*/


type ExpressionType = 
      'value' 
    | 'word'
    | 'apply' 
;

type Expression = ValueExpression | ApplyExpression | WordExpression


type BaseExpression = {
    type: ExpressionType
}

type ValueExpression = BaseExpression & {
    type : 'value'
    value: string | number
}

type WordExpression = BaseExpression & {
    type : 'word'
    value: string
}

type ApplyExpression = BaseExpression & {
    type : 'apply'
    operator: string,
    args: Expression[]
}

function parseExpression(program: string): Expression | ApplyExpression | void {
    // remove white space, \t, \n
    program = program.trimStart()

    let {expression, program: programLeft} = nextExpression(program)

    programLeft = programLeft.trimStart()

    if (expression.type === 'word' && programLeft[0] === '(') {
        return parseApplyExpression(expression, programLeft.substring(1))
    } else {
        return expression
    }

}


function parseApplyExpression(expression: WordExpression, programLeft: string): ApplyExpression | void {

    const applyExpression: ApplyExpression = {
        type: 'apply',
        operator: expression.value,
        args: []
    }


    return applyExpression
}

const stringLiteralRegex = /^"([^"\n\r]*)"/
const numberLiteralRegex = /^\d+/
const identifierRegex = /^[^\s(),#"]+/

function nextExpression(program: string): {expression: Expression, program: string} {
    // remove white space, \t, \n
    program = program.trimStart()

    let match;
    let expr: Expression;
    let lengthParsed: number
    if (match = stringLiteralRegex.exec(program)) {
        expr = {type: 'value', value: match[1] }
        lengthParsed = match[1].length + 2
    } else if (match = numberLiteralRegex.exec(program)) {
        expr = {type: 'value', value: Number(match[0])}
        lengthParsed = match[0].length
    } else if (match = identifierRegex.exec(program)) {
        expr = {type: 'word', value: match[0]}
        lengthParsed = match[0].length
    } else {
        throw new SyntaxError("invalid syntax " + program);
    }

    return { expression: expr, program: program.slice(lengthParsed) }
}


// ----- TEST ------

for (let p of ['do', '123', '"hello"', '"hello"    ', '"fefefe' ]) {
    printExpression(p)
}

function printExpression(s: string) {
    try {
        console.log(nextExpression(s))
    } catch (err) {
        console.error((err as SyntaxError).message)
    }
}
