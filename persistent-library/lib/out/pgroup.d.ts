export declare class PGroup<T> {
    static empty: PGroup<unknown>;
    private _set;
    private constructor();
    add(val: T): PGroup<T>;
    delete(val: T): PGroup<T>;
    has(val: T): boolean;
}
//# sourceMappingURL=pgroup.d.ts.map