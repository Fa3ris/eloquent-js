export class Vector2 {
    x: number
    y: number

    constructor(x: number = 0, y: number = 0) {
        this.x = x;
        this.y = y;
    }

    add(other: Vector2): Vector2 {
        this.x += other.x
        this.y += other.y
        return this   
    }

    mul(factor: number): Vector2 {
        this.x *= factor;
        this.y *= factor
        return this
    }
}
