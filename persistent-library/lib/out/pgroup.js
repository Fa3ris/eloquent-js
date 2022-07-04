"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PGroup = void 0;
class PGroup {
    constructor() {
        this._set = new Set();
    }
    add(val) {
        const res = new PGroup();
        for (let toCopy of this._set.values()) {
            res._set.add(toCopy);
        }
        res._set.add(val);
        return res;
    }
    delete(val) {
        const res = new PGroup();
        for (let toCopy of this._set.values()) {
            res._set.add(toCopy);
        }
        res._set.delete(val);
        return res;
    }
    has(val) {
        return this._set.has(val);
    }
}
exports.PGroup = PGroup;
PGroup.empty = new PGroup();
