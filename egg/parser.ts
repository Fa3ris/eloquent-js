
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
    operator: Expression,
    args: Expression[]
}


/**
 * manipulate the string content of the program
 * and avoid returning the updated string from function call
 * because cannot pass string content by reference
 */
class Program {
    content: string

    constructor(content: string) {
        this.content = content
    }

     /**
     * remove white space, \t, \n
    */
    skipWhiteSpace(): Program {
        this.content = this.content.trimStart()
        return this
    }

    discardChar(n: number): Program {
        this.content = this.content.substring(n)
        return this
    }

    toString() {
        return this.content
    }

    toNextChar() {
        this.content = this.content.trimStart()
        return this
    }

    get nextChar(): string {
        return this.content.charAt(0)
    }
}

function parseExpression(program: Program): Expression | ApplyExpression {
    // remove white space, \t, \n
    program.skipWhiteSpace()

    const expression = nextExpression(program)

    program.skipWhiteSpace()

    if (expression.type === 'word' && program.nextChar === '(') { // foo( ...
        return parseApplyExpression(expression, program.discardChar(1))
    } else {
        return expression
    }

}


function parseApplyExpression(expression: WordExpression | ApplyExpression, program: Program): ApplyExpression {

    const applyExpression: ApplyExpression = {
        type: 'apply',
        operator: expression,
        args: []
    }

    while (program.nextChar !== ')') {

        program.skipWhiteSpace()
        applyExpression.args.push(parseExpression(program))

        if (program.nextChar === ',') { // next argument
            program.discardChar(1)
        } else if (program.nextChar !== ')') { // expected end of arguments
            throw new SyntaxError("expected ',' or ')' but got " + program.nextChar);   
        }
    }

    // change reference to indicate to TS that getter nextChar has changed and does not === ')' - while loop exit
    program = program.discardChar(1)
    program.skipWhiteSpace()

    if (program.nextChar === '(') {
        // an apply expression can itself be applied
        // foo(1)(6)
        return parseApplyExpression(applyExpression, program.discardChar(1))
    } else {
        return applyExpression
    }
}

const stringLiteralRegex = /^"([^"\n\r]*)"/ // [^...] = tout sauf ...
const numberLiteralRegex = /^\d+/
const identifierRegex = /^[^\s(),#"]+/

function nextExpression(program: Program): Expression {

    program.skipWhiteSpace()

    let match;
    let expr: Expression;
    let lengthParsed: number
    if (match = stringLiteralRegex.exec(program.content)) {
        expr = {type: 'value', value: match[1] }
        lengthParsed = match[1].length + 2
    } else if (match = numberLiteralRegex.exec(program.content)) {
        expr = {type: 'value', value: Number(match[0])}
        lengthParsed = match[0].length
    } else if (match = identifierRegex.exec(program.content)) {
        expr = {type: 'word', value: match[0]}
        lengthParsed = match[0].length
    } else {
        throw new SyntaxError("invalid syntax " + program);
    }

    program.discardChar(lengthParsed)
    return expr
}


// ----- TEST ------

for (let p of ['do', '123', '"hello"', '"hello"    ', '"fefefe', "      \nhola" ]) {
    printExpression(p)
}

function printExpression(s: string) {

    try {
        console.log(nextExpression(new Program(s)))
    } catch (err) {
        console.error((err as SyntaxError).message)
    }
}
