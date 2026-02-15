export class Entity { // where it all started
    constructor(ID) {
        this.ID = ID;
        this.warp = false;
        this.modify = false;
        this.sense = false;
        // distance used to sort entity base;
        this.distance = 0;
        this.remove = false;
    }
}