import { Entity } from "./entity";

export class Leader extends Entity {
    constructor(ID, entityType) {
        super(ID, ENTITY_TYPES.LEADER);
    }
}