class Train {
    constructor(numCars, power) {
        this.numCars = numCars;
        this.power = power;
    }
    
    identifyCountry() {
    }
}

export class Kiha40 extends Train {
    constructor(numCars, maxSpeed) {
        super(numCars, "Diesel");
        this.maxSpeed = maxSpeed;
    }

    identifyCountry() {
        console.log("Kiha 40 is from Japan");
        console.log("It is a " + this.power + " train");
    }

    getMaxSpeed() {
        console.log("The max speed of " + this.maxSpeed);
    }
}