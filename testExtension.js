export class Animal {
    constructor(id) {
        console.log("An animal with name " + id + " is created");
    }
    sound() {
        console.log("I am an animal");
    }
}

export class Dog extends Animal {
    constructor(id) {
        super(id);
    }
    sound() {
        console.log("bark");
    }
}