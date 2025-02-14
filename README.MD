# Change Set

An attempt at type safe ChangeSets, seems the compiler is happy enough with the exception oif the
chaange-set constructor where I had to supress the warnings.

## Super basic usage
```typescript
export class User extends ChangeSet {
    @attr() name: string;
    @attr() age: number;
}

const user = new User({name: 'Joe', age: 25});
user.name = 'John'
user.name == 'John'; // true
user.attributeFor('name').dirty // true
user.reset()
user.attributeFor('name').dirty // false
user.name == 'Joe'; // true
```

## Collection  
```typescript
export class User extends ChangeSet {
    @attr() name: string;
    @attr() age: number;
}

const user1 = new User({name: 'Joe', age: 25});
const user2 = new User({name: 'Joe 2', age: 25});
const user3 = User.fromArray([user1, user2])

user3.attributeFor('age').mixed // false 
user3.attributeFor('name').mixed // true 
```
