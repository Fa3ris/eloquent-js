import { runGame } from "./game/core.js";
import { Entity, Player } from "./game/entities.js";
import { Level } from "./game/level.js";
import { aabbCollision } from "./game/utils.js";
import { DOMRenderer } from "./render/dom-renderer.js";


export type GameStatus = 'playing' | 'win' | 'lose';

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

    update(step: number, keys: {[key: string]: string}): State {

        this.entities = this.entities.map(entity => entity.update(step, this, keys))

        let newState = new State(this.level, this.entities, this.status)

        if (newState.status != 'playing') {
            return newState
        }

        const player = newState.player

        if (this.level.touchesBgType(player.pos, player.size, "lava")) {
            return new State(this.level, this.entities, 'lose')
        }


        for (let entity of this.entities) {
            if (entity != player && aabbCollision(entity, player)) {
                newState = entity.collideWithPlayer(newState)
            }
        }

        return newState
    }
}



if (typeof window !== 'undefined') {
    runGame(DOMRenderer)
}