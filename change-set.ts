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

export function hasOne() {
    return (target, key) => {
        // Register keys with the class
        target.registerHasOne(key, undefined);

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

export function hasMany() {
    return (target, key) => {
        // Register keys with the class
        target.registerHasMany(key, undefined);

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


class Attribute {
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

class HasOne {
    mixed: boolean = false;
}

class HasMany {
    mixed: boolean = false;
}

const classAttributeMap = new Map<Function, string[]>();
const classHasManyMap = new Map<Function, string[]>();
const classHasOneMap = new Map<Function, string[]>();

export class ChangeSet {
    _hasOnes: Map<string, HasMany>;

    // These are just here to imagine how things might work in the future, you could probably
    // do something interesting and recursive to compute dirtiness / changes, but more work than
    // I wanna do today
    _hasManies: Map<string, HasMany>;
    _attributes: Map<string, Attribute>;

    // I don't understand TS enough here to make this work in a _more correct_ sorta way, I
    // think you could do something with record objects but I'm pretty green still.
    constructor(args: unknown = {}) {
        const attributesNames = classAttributeMap.get(this.constructor) ?? [];
        attributesNames.forEach(attributeName => {
            // @ts-ignore
            const value = args[attributeName] || this[attributeName];
            // @ts-ignore
            this.registerAttribute(attributeName, new Attribute(value));
        })
    }

    registerAttribute(name: string, value: Attribute) {
        this._register(name, value, classAttributeMap)
    }

    registerHasOne(name: string, value: Attribute) {
        this._register(name, value, classHasOneMap)
    }

    registerHasMany(name: string, value: Attribute) {
        this._register(name, value, classHasManyMap)
    }

    _register(name: string, value: Attribute, map: Map<Function, string[]>) {
        if (!value) {
            const arr = map.get(this.constructor) ?? [];
            arr.push(name)
            map.set(this.constructor, arr);
        }
        else {
            this.attributes.set(name, value);
        }
    }

    attributeFor(name: string): Attribute {
        return this.attributes.get(name);
    }

    get attributes() {
        return this._attributes ||= new Map();
    }

    get attributesNames() {
        return Array.from(this.attributes.keys());
    }

    get attributesValues() {
        return Array.from(this.attributes.values());
    }

    get hasOnes() {
        return this._hasOnes ||= new Map();
    }

    get hasManies() {
        return this._hasManies ||= new Map();
    }

    get dirty() {
        return this.attributesValues.some(attribute => attribute.dirty);
    }

    get changes() {
        return Array.from(this.attributes).reduce((acc, [key, attr]) => {
            if (attr.dirty) {
                acc[key] = attr.value;
            }

            return acc;
        }, {});
    }

    reset() {
        this.attributesValues.forEach(attribute => attribute.reset());
    }

    static fromArray(from: ChangeSet[]) {
        const retVal = new this({});

        retVal
            .attributesNames
            .forEach((attrName) => {
                const initialValue = from[0][attrName];
                const attr = retVal.attributeFor(attrName);
                attr.mixed = !from.every((cs) => cs[attrName] === initialValue);
            })

        return retVal;
    }

}
