import { Entity, Player } from "./game/entities.js";
import { Level } from "./game/level.js";


type GameStatus = 'playing' | 'win' | 'lose';

class State {
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


State.start(new Level())
// new Level().print();