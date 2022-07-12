
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

export type Expression = ValueExpression | ApplyExpression | WordExpression


type BaseExpression = {
    type: ExpressionType
}

export type ValueExpression = BaseExpression & {
    type : 'value'
    value: string | number
}

export type WordExpression = BaseExpression & {
    type : 'word'
    value: string
}

export type ApplyExpression = BaseExpression & {
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
        this.toNextChar()
        return this
    }

    toString() {
        return this.content
    }

    toNextChar() {
        this.content = this.content.trimStart()
        // if current char = #, go to next line and skip some more
        while (this.nextChar === '#') {
            const lineTerminator = this.content.indexOf('\n')
            this.content = this.content.substring(lineTerminator)
            this.content = this.content.trimStart()
        }
        return this
    }

    get nextChar(): string {
        return this.content.charAt(0)
    }

    get eof(): boolean {
        return this.content.length === 0   
    }
}

function parseExpression(program: Program): Expression | ApplyExpression {
    program.toNextChar()

    let match;
    let expression: Expression;
    let lengthParsed: number
    if (match = stringLiteralRegex.exec(program.content)) {
        expression = {type: 'value', value: match[1] }
        lengthParsed = match[1].length + 2 // content + 2 double-quote
    } else if (match = numberLiteralRegex.exec(program.content)) {
        expression = {type: 'value', value: Number(match[0])}
        lengthParsed = match[0].length
    } else if (match = identifierRegex.exec(program.content)) {
        expression = {type: 'word', value: match[0]}
        lengthParsed = match[0].length
    } else {
        throw new SyntaxError("invalid syntax " + program);
    }

    program.discardChar(lengthParsed)

    if (expression.type === 'word' && program.nextChar === '(') { // foo( ... | foo ( ...
        return parseApplyExpression(expression, program.discardChar(1)) // discard '('
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
    
    // already at non blank char when arriving here
    while (program.nextChar !== ')') { // end of arguments

        applyExpression.args.push(parseExpression(program))

        if (program.nextChar === ',') { // next argument
            program.discardChar(1) // discard ','
        } else if (program.nextChar !== ')') { // expected end of arguments
            throw new SyntaxError("expected ',' or ')' but got " + program.nextChar);   
        }
    }

    // change reference to indicate to TS that getter nextChar has changed and does not === ')' - while loop exit condition
    program = program.discardChar(1) // discard ')'

    if (program.nextChar === '(') {
        // an apply expression can itself be applied
        // foo(1)(6)
        return parseApplyExpression(applyExpression, program.discardChar(1))
    } else {
        return applyExpression
    }
}

export function parse(content: string): Expression {
    const program = new Program(content);
    const expression = parseExpression(program)
    
    program.toNextChar();
    if (!program.eof) {
        throw new SyntaxError("text remain after parsing");
    }
    return expression
}

const stringLiteralRegex = /^"([^"\n\r]*)"/ // [^...] = tout sauf ...
const numberLiteralRegex = /^-?\d+/
const identifierRegex = /^[^\s(),#"]+/

function nextExpression(program: Program): Expression {

    program.toNextChar()

    let match;
    let expr: Expression;
    let lengthParsed: number
    if (match = stringLiteralRegex.exec(program.content)) {
        expr = {type: 'value', value: match[1] }
        lengthParsed = match[1].length + 2 // content + 2 double-quote
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

if (require.main === module) // if was called via node and not reported
for (let p of ['do', '123', '"hello"', '"hello"    ', '"fefefe', "      \nhola", "+(a, 10)",
`  * ( b ,   100 )  `, 

`  - 
( 
    c 
    ,
       -20 )  
       
       
       `,

'>(x, 5)',

'+(x, 5)(0)'
 ]) {
    // printExpression(p)
    printParse(p)
}

function printExpression(s: string) {

    try {
        console.log(nextExpression(new Program(s)))
    } catch (err) {
        console.error((err as SyntaxError).message)
    }
}

function printParse(s: string) {
    try {
        console.dir(parse(s), {depth: null} )
    } catch (err) {
        console.error((err as SyntaxError).message)
    }
}
