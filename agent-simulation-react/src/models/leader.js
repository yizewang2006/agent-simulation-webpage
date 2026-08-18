import { Entity } from "./entity.js";
import { ENTITY_TYPES } from "../utils/constants.js";

export class Leader extends Entity {
    constructor(id, name, entityType) {
        super(id, name, ENTITY_TYPES.LEADER);
    }
}
