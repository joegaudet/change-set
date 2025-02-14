import {HasOne} from "./has-one";
import {HasMany} from "./has-many";
import {Attribute} from "./attribute";

const classAttributeMap = new Map<String, String[]>();

export class ChangeSet {
    _hasOnes: Map<HasOne, HasMany>;

    // These are just here to imagine how things might work in the future, you could probably
    // do something interesting and recursive to compute dirtiness / changes, but more work than
    // I wanna do today
    _hasManies: Map<string, HasMany>;
    _attributes: Map<string, Attribute>;

    // I don't understand TS enough here to make this work in a _more correct_ sorta way, I
    // think you could do something with record objects but I'm pretty green still.
    constructor(args: unknown = {}) {
        const attributesNames = classAttributeMap.get(this.constructor.name) ?? [];
        attributesNames.forEach(attributeName => {
            // @ts-ignore
            const value = args[attributeName] || this[attributeName];
            // @ts-ignore
            this.registerAttribute(attributeName, new Attribute(value));
        })
    }

    registerAttribute(name: string, value: Attribute) {
        if (!value) {
            const arr = classAttributeMap.get(this.constructor.name) ?? [];
            arr.push(name)
            classAttributeMap.set(this.constructor.name, arr);
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
