import exp from "constants";

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

type Expression = any

function parseExpression(program: string): Expression {
    // remove white space, \t, \n
    program = program.trimStart()

}


const stringLiteralRegex = /^"([^"\n\r]*)"/
const numberLiteralRegex = /^\d+/
const identifierRegex = /^[^\s(),#"]+/

function nextExpression(program: string): Expression {
    // remove white space, \t, \n
    program = program.trimStart()

    let match;

    if (match = stringLiteralRegex.exec(program)) {
        return {type: 'value', value: match[1] }
    } else if (match = numberLiteralRegex.exec(program)) {
        return {type: 'value', value: Number(match[0])}
    } else if (match = identifierRegex.exec(program)) {
        return {type: 'word', value: match[0]}
    } else {
        throw new SyntaxError("invalid syntax " + program);
    }
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
