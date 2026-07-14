import { Entity } from "./entity.js";
import { ENTITY_TYPES } from "../utils/constants.js";

export class Leader extends Entity {
    constructor(ID, entityType) {
        super(ID, ENTITY_TYPES.LEADER);
    }
}
