export class PGroup<T> {

    static empty = new PGroup()
    private _set = new Set<T>()

    private constructor() {}

    add(val: T): PGroup<T> {
        const res = new PGroup<T>()
        for (let toCopy of this._set.values()) {
            res._set.add(toCopy)
        }
        res._set.add(val)
        return res;
    }

    delete(val: T): PGroup<T> {
        const res = new PGroup<T>()
        for (let toCopy of this._set.values()) {
            res._set.add(toCopy)
        }
        res._set.delete(val)
        return res;
    }

    has(val: T): boolean {
        return this._set.has(val)
    }
}