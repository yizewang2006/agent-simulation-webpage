import { Entity } from "./entity";
import { ENTITY_TYPES } from "./constants";

export class Exit extends Entity {
    constructor(ID, entityType) {
        super(ID, ENTITY_TYPES.EXIT);
    }
}