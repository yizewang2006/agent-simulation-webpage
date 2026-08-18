export class Entity { // where it all started
    constructor(id) {
        this.id = id;
        this.warp = false;
        this.modify = false;
        this.sense = false;
        // distance used to sort entity base;
        this.distance = 0;
        this.remove = false;
    }
}
