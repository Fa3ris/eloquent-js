import { Entity } from "./entities";

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

export function trackKeys(keysToTrack: string[]): KeysDown {
    throw new Error("not implemented");
}


export type KeysDown = {[key: string]: any };

export function goLeft(keys: KeysDown): boolean {
    return keys['ArrowLeft']
    
}

export function goRight(keys: KeysDown): boolean {
    return keys['ArrowRight']
}

export function jump(keys: KeysDown): boolean {
    return keys['ArrowUp']   
}


export function runAnimation(func: any) {

}

export function runLevel() {}
export function runGame() {}
