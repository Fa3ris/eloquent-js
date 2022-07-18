import { GameStatus, State } from "../main.js";
import { goLeft, goRight, jump, KeysDown, Vector2 } from "./utils.js";

type EntityType = 'player' | 'coin' | 'lava'
export type Entity = {
    update(step: number, state: State, keys: { [key: string]: string; }): Entity;

    collideWithPlayer(state: State): State;

    type: EntityType
    pos: Vector2
    size: Vector2
}

export type EntityCreatorFn = (pos: Vector2, char: string) => Entity;

export class Player {

    pos: Vector2;
    _speed: Vector2

    constructor(pos: Vector2, speed: Vector2 = new Vector2) {
        this.pos = pos
        this._speed = speed
    }

    static create(pos: Vector2, char: string): Entity {
            
        return new Player(pos.add(new Vector2(0, -0.5)))
    }

    get size() {
        return Player.size
    }

    static readonly size = new Vector2(1, 1.5)

    static readonly xSpeed = 7;
    static readonly gravity = 30
    static readonly jumpSpeed = 17

    get type(): EntityType {
        return 'player'
    }

    update(step: number, state: State, keys: KeysDown): Entity {

        let xSpeed = 0;

        if (goLeft(keys)) {
            xSpeed -= Player.xSpeed
        }
        if (goRight(keys)) {
            xSpeed += Player.xSpeed    
        }

        const newX = this.pos.add(new Vector2(xSpeed * step, 0))
        let pos: Vector2
        if (!state.level.touchesBgType(newX, this.size, 'wall')) {
            pos = newX
        } else {
            pos = this.pos
        }

        let ySpeed = this._speed.y + step * Player.gravity
        const newY = pos.add(new Vector2(0, ySpeed * step))

        if (!state.level.touchesBgType(newY, this.size, 'wall')) {
            pos = newY
        // we hit a wall
        } else if (jump(keys) && ySpeed > 0) { // weird
            ySpeed -= Player.jumpSpeed
        } else {
            ySpeed = 0
        }
        return new Player(pos, new Vector2(xSpeed, ySpeed))
    }

    collideWithPlayer(state: State): State {
        throw new Error('player cannot collide with himself')
    }

}


export class Coin {

    pos: Vector2;
    _basePos: Vector2;
    _wobble: number

    constructor(pos: Vector2, basePos: Vector2, wobble: number) {
        this.pos = pos
        this._basePos = basePos;
        this._wobble = wobble
    }

    static create(pos: Vector2, char: string): Entity {
        return new Coin(pos, new Vector2(), 1)
    }

    static readonly size = new Vector2(1, 1)

    static readonly wobbleSpeed = 8
    static readonly wobbleRadius = 0.07

    get size() {
        return Coin.size
    }

    get type(): EntityType {
        return 'coin'
    }

    update(step: number, state: State, keys: KeysDown): Entity { 
        const currentWobble = this._wobble + step * Coin.wobbleSpeed;
        const wobbleOffset = Math.sin(currentWobble) * Coin.wobbleRadius
        return new Coin(this._basePos.add(new Vector2(0, wobbleOffset)), this._basePos, this._wobble)
    }

    collideWithPlayer(state: State): State {
        const filtered = state.entities.filter(e => e != this)
        const newStatus: GameStatus = filtered.some(e => e.type === 'coin') ? state.status : "win"
        return new State(state.level, filtered, newStatus)
    }
}

export class Lava {

    pos: Vector2;
    speed: Vector2;
    _behaviour: LavaBehaviour

    constructor(pos: Vector2, speed: Vector2, behaviour: LavaBehaviour) {
        this.pos = pos
        this._behaviour = behaviour
        this.speed = new Vector2()
    }

    static create(pos: Vector2, char: string): Entity {
        return new Lava(pos, new Vector2(), new DrippingLava(pos))
    }

    static readonly size = new Vector2(1, 1)

    get size() {
        return Lava.size
    }

    get type(): EntityType {
        return 'lava'
    }

    update(step: number, state: State, keys: KeysDown): Entity {
        return this._behaviour.update(step, state, this)

    }

    collideWithPlayer(state: State): State {
        return new State(state.level, state.entities, 'lose')
    }

}


interface LavaBehaviour {
    update(step: number, state: State, lava: Lava): Lava
}

export class HorizontalLava implements LavaBehaviour {
    update(step: number, state: State, lava: Lava): Lava {
        const newPos = lava.pos.add(lava.speed.mul(step))

        if (!state.level.touchesBgType(newPos, lava.size, "wall")) {
            return new Lava(newPos, lava.speed, this)
        }
        
        return new Lava(newPos, lava.speed.mul(-1), this)

    }
}

export class VerticalLava implements LavaBehaviour {
    update(step: number, state: State, lava: Lava): Lava {
        const newPos = lava.pos.add(lava.speed.mul(step))

        if (!state.level.touchesBgType(newPos, lava.size, "wall")) {
            return new Lava(newPos, lava.speed, this)
        }

        return new Lava(newPos, lava.speed.mul(-1), this)
    }
}

export class DrippingLava implements LavaBehaviour {

    resetPos: Vector2

    constructor(resetPos: Vector2) {
        this.resetPos = resetPos
    }

    update(step: number, state: State, lava: Lava): Lava {
        const newPos = lava.pos.add(lava.speed.mul(step))

        if (!state.level.touchesBgType(newPos, lava.size, "wall")) {
            return new Lava(newPos, lava.speed, this)
        }

        return new Lava(this.resetPos, lava.speed, this)
    }
}