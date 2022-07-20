import { runGame } from "./game/core.js";
import { Entity, Player } from "./game/entities.js";
import { Level } from "./game/level.js";
import { aabbCollision } from "./game/utils.js";
import { DOMRenderer } from "./render/dom-renderer.js";


export type GameStatus = 'playing' | 'win' | 'lose';

export class GlobalState {

    lives: number

    paused = false

    debug = false

    constructor(lives: number) {
        this.lives = lives
    }
}

export class State {
    level: Level
    entities: Entity[]
    status: GameStatus

    globalState: GlobalState

    private constructor(level: Level, entities: Entity[], status: GameStatus, globalState: GlobalState) {
        this.level = level
        this.entities = entities
        this.status = status
        this.globalState = globalState
    }

    static start(level: Level, globalState: GlobalState): State {
        level.print()
        return new State(level, level.entities, 'playing', globalState)
    }

    get player(): Player {
        return this.entities.find(e => e.type === 'player') as Player
    }

    forStatus(newStatus: GameStatus): State {
        return new State(this.level, this.entities, newStatus, this.globalState)
    }

    forEntitiesAndStatus(newEntities: Entity[], newStatus: GameStatus): State {
        return new State(this.level, newEntities, newStatus, this.globalState)
    }

    update(step: number, keys: {[key: string]: string}): State {

        this.entities = this.entities.map(entity => entity.update(step, this, keys))

        let newState = new State(this.level, this.entities, this.status, this.globalState)

        if (newState.status != 'playing') {
            return newState
        }

        const player = newState.player

        if (this.level.touchesBgType(player.pos, player.size, "lava")) {
            return new State(this.level, this.entities, 'lose', this.globalState)
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