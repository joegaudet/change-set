export function attr() {
    return (target, key) => {
        // Register keys with the class
        target.registerAttribute(key, undefined);

        Object.defineProperty(target, key, {
            get() {
                return this.attributeFor(key)?.value;
            },
            set(newValue: unknown) {
                this.attributeFor(key).value = newValue;
            }
        });
    };
}


export class Attribute {
    mixed: boolean = false;
    _value: unknown;
    _initialValue: unknown;

    constructor(value) {
        this._value = value;
        this._initialValue = value;
    }

    get value() {
        return this._value;
    }

    set value(value: any) {
        this._value = value;
    }

    get dirty() {
        return this._initialValue !== this._value;
    }

    reset() {
        this._value = this._initialValue;
    }

}

