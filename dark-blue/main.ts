import { Entity, Player } from "./game/entities.js";
import { Level } from "./game/level.js";
import { DOMRenderer } from "./render/dom-renderer.js";


type GameStatus = 'playing' | 'win' | 'lose';

export class State {
    level: Level
    entities: Entity[]
    status: GameStatus

    constructor(level: Level, entities: Entity[], status: GameStatus) {
        this.level = level
        this.entities = entities
        this.status = status
    }

    static start(level: Level): State {
        level.print()
        return new State(level, level.entities, 'playing')
    }

    get player(): Player {
        return this.entities.find(e => e.type === 'player') as Player
    }
}


const level = new Level()
const state = State.start(level)

if (typeof window !== 'undefined') {
    const renderer = new DOMRenderer(document.body, level)
    renderer.syncState(state)
}