import { Vector2 } from "./utils.js";

type EntityType = 'player' | 'coin' | 'lava'
export type Entity = {

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

    get type(): EntityType {
        return 'player'
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

    get size() {
        return Coin.size
    }

    get type(): EntityType {
        return 'coin'
    }
}

export class Lava {

    pos: Vector2;
    _behaviour: LavaBehaviour

    constructor(pos: Vector2, behaviour: LavaBehaviour) {
        this.pos = pos
        this._behaviour = behaviour
    }

    static create(pos: Vector2, char: string): Entity {
        return new Lava(pos, new DrippingLava())
    }

    static readonly size = new Vector2(1, 1)

    get size() {
        return Lava.size
    }

    get type(): EntityType {
        return 'lava'
    }
}


interface LavaBehaviour {
    update(): void
}

export class HorizontalLava implements LavaBehaviour {
    update(): void {
        throw new Error("Method not implemented.");
    }
}

export class VerticalLava implements LavaBehaviour {
    update(): void {
        throw new Error("Method not implemented.");
    }
}

export class DrippingLava implements LavaBehaviour {
    update(): void {
        throw new Error("Method not implemented.");
    }
}