# Change Set

An attempt at type safe ChangeSets, seems the compiler is happy enough with the exception oif the
change-set constructor where I had to suppress the warnings. Large limitation it will not check any 
of the types of the constructor hash, but will all the mutators. 

Given TS decorators seem to be a bit all over the place might not be ready for prime time, but
comports to the existing ES decorator proposal spec.


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
