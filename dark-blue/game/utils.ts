import { Entity } from "./entities.js";

export class Vector2 {
    x: number
    y: number

    constructor(x: number = 0, y: number = 0) {
        this.x = x;
        this.y = y;
    }

    add(other: Vector2): Vector2 {
        return new Vector2(this.x + other.x, this.y + other.y)
    }

    mul(factor: number): Vector2 {
        return new Vector2(this.x * factor, this.y * factor)
    }
}


export function aabbCollision(e1: Entity, e2: Entity): boolean {

    return e1.pos.x + e1.size.x > e2.pos.x
    && e1.pos.x < e2.pos.x + e2.size.x
    && e1.pos.y + e1.size.y > e2.pos.y
    && e1.pos.y < e2.pos.y + e2.size.y
    
}

const LEFT = "ArrowLeft"
const RIGHT = "ArrowRight"
const UP = " " // space

export function trackKeys(keysToTrack: string[] = [LEFT, RIGHT, UP]): KeysDown {
    const keys: KeysDown = Object.create({})

    function track(e: KeyboardEvent) {
        if (keysToTrack.includes(e.key)) {
            keys[e.key] = e.type === 'keydown'
            e.preventDefault()
        }
    }

    window.addEventListener("keydown", track)
    window.addEventListener("keyup", track)
    keys.untrack = function() {
        console.log('untracking keyboard events')
        window.removeEventListener("keydown", track)
        window.removeEventListener("keyup", track)
    }
    return keys
}


export type KeysDown = {
    [key: string]: any,
    untrack(): void
};

export function goLeft(keys: KeysDown): boolean {
    return keys[LEFT]
    
}

export function goRight(keys: KeysDown): boolean {
    return keys[RIGHT]
}

export function jump(keys: KeysDown): boolean {
    return keys[UP]   
}