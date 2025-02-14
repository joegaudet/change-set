import {describe, it, expect} from 'vitest';
import {ChangeSet} from "./change-set";
// import {hasMany} from "./has-many";
// import {hasOne} from "./has-one";
import {attr} from "./attribute";

export class User extends ChangeSet {
    @attr() name: string;
    @attr() age: number;
    // @hasOne user: User;
    // @hasMany users: User[];
}

describe('ChangeSet', () => {

    it('should create a new instance from a hash', () => {
        const change = new User({name: 'Joe', age: 25});
        expect(change.name).to.equal('Joe');
        expect(change.age).to.equal(25);
    });

    it('should track changes of the attributes', () => {
        const change = new User({name: 'John', age: 25});
        expect(change.attributeFor('name').value).toEqual('John');
        expect(change.attributeFor('name').dirty).toEqual(false);
        change.name = 'Jane';
        expect(change.attributeFor('name').dirty).toEqual(true);
        expect(change.dirty).toEqual(true);
        expect(change.changes).toEqual({name: 'Jane'});
    });

    it('should allow resetting changes of an attribute', ()    => {
        const change = new User({name: 'John', age: 25});
        change.name = 'Jane';
        expect(change.changes).toEqual({name: 'Jane'});
        change.attributeFor('name').reset();
        expect(change.changes).toEqual({});
        expect(change.dirty).to.equal(false);
    });

    it('should allow resetting changes of all attributes', ()    => {
        const change = new User({name: 'John', age: 25});
        change.name = 'Jane';
        expect(change.changes).toEqual({name: 'Jane'});
        expect(change.dirty).to.equal(true);
        change.reset();
        expect(change.changes).toEqual({});
        expect(change.dirty).to.equal(false);
    })

    it('should allow enumeration of all attribute keys', ()    => {
        const change = new User({name: 'John', age: 25});
        expect(change.attributesNames).toEqual(['name', 'age']);
    });

    it('should express its changes as a hash', ()    => {
        const change = new User({name: 'John', age: 25});
        change.name = 'Jane';
        change.age = 30;
        expect(change.changes).toEqual({name: 'Jane', age: 30});
    });

    it('should allow being constructed from an array of hashes, marking attributes that are not equal amongs the hashes as mixed', () => {
        const change1 = new User({name: 'John', age: 25});
        const change2 = new User({name: 'Jane', age: 25});
        const change3 = User.fromArray([change1, change2]);
        expect(change3.attributeFor('age').mixed).to.equal(false);
        expect(change3.attributeFor('name').mixed).to.equal(true);
    });
});