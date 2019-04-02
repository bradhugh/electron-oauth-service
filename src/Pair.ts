export class Pair<T1, T2> {
    private _key: T1;
    private _value: T2;

    constructor(key: T1, value: T2) {
        this._key = key;
        this._value = value;
    }

    get key(): T1 {
        return this._key;
    }

    get value(): T2 {
        return this._value;
    }
}