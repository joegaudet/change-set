/**
 * Property decorator that makes a field of a {@link ChangeSet} subclass a tracked attribute.
 *
 * Reading the property returns the attribute's current value, and assigning to it changes that
 * value, which marks the attribute dirty until it is {@link ChangeSet.reset | reset}. Uses
 * TypeScript's legacy decorators, so the project needs `experimentalDecorators: true`.
 *
 * ```ts
 * class User extends ChangeSet {
 *     @attr() name: string;
 * }
 * ```
 */
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

/**
 * Property decorator reserved for a single related change set. Not implemented yet: it
 * registers the key with the class, but the property always reads `undefined` and assigning to
 * it throws, because no attribute is created for it.
 */
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

/**
 * Property decorator reserved for a list of related change sets. Not implemented yet: it
 * registers the key with the class, but the property always reads `undefined` and assigning to
 * it throws, because no attribute is created for it.
 */
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


/**
 * One tracked attribute of a {@link ChangeSet}: its current value, the value it started with,
 * and whether the two differ. Get one with {@link ChangeSet.attributeFor}.
 */
export class Attribute {
    /**
     * True when the change sets passed to {@link ChangeSet.fromArray} disagree on this
     * attribute's value. Always false otherwise.
     */
    mixed: boolean = false;
    /** @internal */
    _value: unknown;
    /** @internal */
    _initialValue: unknown;

    /** Starts the attribute at `value`, which also becomes the value {@link reset} restores. */
    constructor(value) {
        this._value = value;
        this._initialValue = value;
    }

    /** The current value. Assigning to it changes the value without touching the initial one. */
    get value() {
        return this._value;
    }

    /** Sets the current value; the initial value stays as it was. */
    set value(value: any) {
        this._value = value;
    }

    /** True when the current value is not `===` the initial value. */
    get dirty() {
        return this._initialValue !== this._value;
    }

    /** Puts the initial value back, so the attribute is no longer dirty. */
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

/**
 * Base class for a model whose attribute changes are tracked. Subclass it, mark fields with
 * {@link attr}, and construct it from a hash of initial values. Assignments are then recorded as
 * changes that can be read back with {@link ChangeSet.changes | changes} or undone with
 * {@link ChangeSet.reset | reset}.
 *
 * ```ts
 * class User extends ChangeSet {
 *     @attr() name: string;
 *     @attr() age: number;
 * }
 *
 * const user = new User({name: 'Joe', age: 25});
 * user.name = 'John';
 * user.changes; // {name: 'John'}
 * user.reset();
 * user.name; // 'Joe'
 * ```
 */
export class ChangeSet {
    /** @internal */
    _hasOnes: Map<string, HasMany>;

    // These are just here to imagine how things might work in the future, you could probably
    // do something interesting and recursive to compute dirtiness / changes, but more work than
    // I wanna do today
    /** @internal */
    _hasManies: Map<string, HasMany>;
    /** @internal */
    _attributes: Map<string, Attribute>;

    // I don't understand TS enough here to make this work in a _more correct_ sorta way, I
    // think you could do something with record objects but I'm pretty green still.
    /**
     * Creates an {@link Attribute} for each {@link attr} field, starting at the matching key of
     * `args`. A missing or falsy value (`0`, `''`, `false`) in `args` starts the attribute at
     * `undefined`. The keys of `args` are not type checked.
     */
    constructor(args: unknown = {}) {
        const attributesNames = classAttributeMap.get(this.constructor) ?? [];
        attributesNames.forEach(attributeName => {
            // @ts-ignore
            const value = args[attributeName] || this[attributeName];
            // @ts-ignore
            this.registerAttribute(attributeName, new Attribute(value));
        })
    }

    /**
     * Used by {@link attr}. Without a `value`, records `name` as an attribute of this class;
     * with one, stores `value` as this instance's attribute called `name`.
     */
    registerAttribute(name: string, value: Attribute) {
        this._register(name, value, classAttributeMap)
    }

    /**
     * Used by {@link hasOne}. Without a `value`, records `name` as a has-one key of this class;
     * with one, stores `value` as this instance's attribute called `name`.
     */
    registerHasOne(name: string, value: Attribute) {
        this._register(name, value, classHasOneMap)
    }

    /**
     * Used by {@link hasMany}. Without a `value`, records `name` as a has-many key of this
     * class; with one, stores `value` as this instance's attribute called `name`.
     */
    registerHasMany(name: string, value: Attribute) {
        this._register(name, value, classHasManyMap)
    }

    /** @internal */
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

    /** The {@link Attribute} for the field called `name`, or `undefined` if there is none. */
    attributeFor(name: string): Attribute {
        return this.attributes.get(name);
    }

    /** Every {@link Attribute} of this instance, keyed by field name. */
    get attributes() {
        return this._attributes ||= new Map();
    }

    /** The names of the tracked fields, in declaration order. */
    get attributesNames() {
        return Array.from(this.attributes.keys());
    }

    /** The {@link Attribute} objects, in the same order as {@link attributesNames}. */
    get attributesValues() {
        return Array.from(this.attributes.values());
    }

    /** Reserved for {@link hasOne} relationships. Always empty for now. */
    get hasOnes() {
        return this._hasOnes ||= new Map();
    }

    /** Reserved for {@link hasMany} relationships. Always empty for now. */
    get hasManies() {
        return this._hasManies ||= new Map();
    }

    /** True when any attribute is {@link Attribute.dirty | dirty}. */
    get dirty() {
        return this.attributesValues.some(attribute => attribute.dirty);
    }

    /** The dirty attributes' current values, as a hash keyed by field name. */
    get changes() {
        return Array.from(this.attributes).reduce((acc, [key, attr]) => {
            if (attr.dirty) {
                acc[key] = attr.value;
            }

            return acc;
        }, {});
    }

    /** {@link Attribute.reset | Resets} every attribute to its initial value. */
    reset() {
        this.attributesValues.forEach(attribute => attribute.reset());
    }

    /**
     * Builds an empty instance of this class that summarises `from`, for editing several
     * records at once: each attribute is {@link Attribute.mixed | mixed} when the records'
     * values for it are not all `===`. No values are copied, so every attribute starts at
     * `undefined`. `from` must not be empty.
     *
     * ```ts
     * const both = User.fromArray([new User({name: 'Joe'}), new User({name: 'Jane'})]);
     * both.attributeFor('name').mixed; // true
     * ```
     */
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
