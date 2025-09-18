import { Animal } from "./_testExtension.js";

export class Cat extends Animal {
    constructor(id) {
        super(id);
    }

    sound() {
        console.log("meow");
    }
}

export class Bird extends Animal {
    constructor(id) {
        super(id);
    }

    sound() {
        console.log("Bird Humms");
    }
}