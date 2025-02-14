import {HasOne} from "./has-one";
import {HasMany} from "./has-many";
import {Attribute} from "./attribute";

const classAttributeMap = new Map<String, String[]>();

export class ChangeSet {
    _hasOnes: Map<HasOne, HasMany>;
    _hasManies: Map<string, HasMany>;
    _attributes: Map<string, Attribute>;

    constructor(args: unknown = {}) {
        const attributesNames = classAttributeMap.get(this.constructor.name) ?? [];
        attributesNames.forEach(attributeName => {
            const value = args[attributeName] || this[attributeName];
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
                attr.value = from.every((cs) => cs[attrName] === initialValue) ? initialValue : 'mixed';
            })

        return retVal;
    }

}
