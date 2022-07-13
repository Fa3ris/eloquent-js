import { Coin, EntityCreatorFn, Lava, Player } from "./entities.js";
import { Vector2 } from "./utils.js";


const levelChars : {[char: string]: string | EntityCreatorFn }= {
    '.': 'empty',
    '#': 'wall',
    '+': 'lava',
    'o': Coin.create,
    '@': Player.create,
    '=': Lava.create,
    '|': Lava.create,
    'v': Lava.create
}

Object.freeze(levelChars)

export class Level {

    private _plan: string;
    private _height: number;
    private _width: number;

    private _state: any[][]
    constructor(plan: string = simpleLevelPlan) {
        this._plan = plan

        const grid = plan.trim().split('\n').map(rowString => [...rowString])
        this._height = grid.length
        this._width = grid[0].length

        this._state = grid.map((rowArr, row) => {
            return rowArr.map((char, col) => {

                const type = levelChars[char]

                if (typeof type === 'string') { return type }

                return String(type(new Vector2(), char).type).toUpperCase()
                return `empty (${row},${col})`
            })
        })
    }

    print() {
        console.group('level')
        console.log(`w: ${this._width} h: ${this._height}`)
        console.log(this._plan)
        console.dir(this._state, {depth: null})
        console.groupEnd()
    }
}

/*
    . empty space
    # wall
    + lava
    @ player
    o coin
    = lava moving horizontally
    | lava movind vertically
    v dripping lava
*/
const simpleLevelPlan = `
......................
..#................#..
..#..............=.#..
..#.........o.o....#..
..#.@......#####...#..
..#####............#..
......#++++++++++++#..
......##############..
......................`;
