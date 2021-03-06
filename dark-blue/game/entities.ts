import { GameStatus, State } from "../main.js";
import { goLeft, goRight, jump, KeysDown, Vector2 } from "./utils.js";

type EntityType = 'player' | 'coin' | 'lava' | 'monster'
export type Entity = {
    update(step: number, state: State, keys: { [key: string]: string; }): Entity;

    collideWithPlayer(state: State): State;

    type: EntityType
    pos: Vector2
    size: Vector2


    debugStr?(): string
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
        // keys["ArrowLeft"]= true
        // debugger
        let xSpeed = 0;

        if (goLeft(keys)) {
            xSpeed -= Player.xSpeed
        } else if (goRight(keys)) {
            xSpeed += Player.xSpeed    
        }

        const movedX = this.pos.add(new Vector2(xSpeed * step, 0))
        let pos: Vector2 = this.pos
        // can move along x if does not hit wall
        if (!state.level.touchesBgType(movedX, this.size, 'wall')) {
            pos = movedX
        } 

        let ySpeed = this._speed.y + step * Player.gravity
        const movedY = pos.add(new Vector2(0, ySpeed * step))

        if (!state.level.touchesBgType(movedY, this.size, 'wall')) {
            pos = movedY
        } else if (jump(keys) && ySpeed > 0) { // jump pressed while going down and touching a wall
            ySpeed -= Player.jumpSpeed
        } else { // do not move y
            ySpeed = 0
        }
        return new Player(pos, new Vector2(xSpeed, ySpeed))
    }

    collideWithPlayer(state: State): State {
        throw new Error('player cannot collide with himself')
    }

    debugStr(): string {
        return 'player' + JSON.stringify({pos: this.pos, speed: this._speed})
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
        let basePos = pos.add(new Vector2(0.2, 0.1));
        return new Coin(basePos, basePos, Math.random() * Math.PI * 2)
    }

    static readonly size = new Vector2(.6, .6)

    static readonly wobbleSpeed = 8
    static readonly wobbleRadius = 0.07

    get size() {
        return Coin.size
    }

    get type(): EntityType {
        return 'coin'
    }

    debugStr(): string {
        return 'coin' + JSON.stringify({pos: this.pos, basepos: this._basePos, wobble: this._wobble})
    }

    update(step: number, state: State, keys: KeysDown): Entity { 
        const currentWobble = this._wobble + step * Coin.wobbleSpeed;
        const wobbleOffset = Math.sin(currentWobble) * Coin.wobbleRadius
        return new Coin(this._basePos.add(new Vector2(0, wobbleOffset)), this._basePos, currentWobble)
    }

    collideWithPlayer(state: State): State {
        const filtered = state.entities.filter(e => e != this)
        const newStatus: GameStatus = filtered.some(e => e.type === 'coin') ? state.status : "win"
        return state.forEntitiesAndStatus(filtered, newStatus)
    }
}

export class Lava {

    pos: Vector2;
    speed: Vector2;
    _behaviour: LavaBehaviour

    constructor(pos: Vector2, speed: Vector2, behaviour: LavaBehaviour) {
        this.pos = pos
        this._behaviour = behaviour
        this.speed = speed
    }

    static create(pos: Vector2, char: string): Entity {
        switch(char) {
            case '=':
                return new Lava(pos, new Vector2(1, 0), new HorizontalLava())
            case '|':
                return new Lava(pos, new Vector2(0, 1), new VerticalLava())
            case 'v':
                return new Lava(pos, new Vector2(0, 1), new DrippingLava(pos))
            default:
                throw new Error("unknown char for lava " + char);
        }
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
        return state.forStatus('lose')
    }

}

export class Monster {

    pos: Vector2;
    speed: Vector2;

    constructor(pos: Vector2, speed: Vector2) {
        this.pos = pos
        this.speed = speed
    }

    static create(pos: Vector2, char: string): Entity {
        return new Monster(pos.add(new Vector2(0, -1)), new Vector2(-1, 0))       
    }

    static readonly size = new Vector2(1.2, 2)

    get size() {
        return Monster.size
    }

    get type(): EntityType {
        return 'monster'
    }

    update(step: number, state: State, keys: KeysDown): Entity {

        const newPos = this.pos.add(this.speed.mul(step))

        if (!state.level.touchesBgType(newPos, this.size, "wall")) {
            return new Monster(newPos, this.speed)
        } else {
            return new Monster(newPos, this.speed.mul(-1))
        }
        
    }

    collideWithPlayer(state: State): State {

        const player = state.player
        const killed = (player.pos.y + player.size.y) < (this.pos.y + 0.2) // factor to be less strict on collision 
                        && (state.player._speed.y > 0) // player is falling
        
        if (killed) {
            const filtered = state.entities.filter(e => e != this)
            return state.forEntitiesAndStatus(filtered, state.status)
        }
        return state.forStatus('lose')
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