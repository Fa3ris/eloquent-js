import { Coin, Entity, EntityCreatorFn, Lava, Player } from "./entities.js";
import { Vector2 } from "./utils.js";


type BackgroundType = 'empty' | 'wall' | 'lava'
const levelChars : {[char: string]: BackgroundType | EntityCreatorFn }= {
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

    _plan: string;
    _height: number;
    _width: number;

    _state: BackgroundType[][]

    _entities: Entity[] = []

    get entities(): Entity[] {
        return this._entities
    }
    constructor(plan: string = simpleLevelPlan) {
        this._plan = plan

        const grid = plan.trim().split('\n').map(rowString => [...rowString])
        this._height = grid.length
        this._width = grid[0].length

        this._state = <BackgroundType[][]> grid.map((rowArr, row) => {
            return rowArr.map((char, col) => {
                const type = levelChars[char]
                if (typeof type === 'string') { return type as BackgroundType }

                const entity: Entity = type(new Vector2(), char); 
                this._entities.push(entity)
                return 'empty'
              }
            )
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
