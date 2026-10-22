import { Entity } from "./entity.js";
import { ENTITY_TYPES } from "../utils/constants.js";

export class Leader extends Entity {
    constructor(id, name, position) {
        super(id, name, ENTITY_TYPES.LEADER, position);
    }
}
