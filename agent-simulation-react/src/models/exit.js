import { Entity } from "./entity.js";
import { ENTITY_TYPES } from "../utils/constants.js";

export class Exit extends Entity {
    constructor(id, name, position) {
        super(id, name, ENTITY_TYPES.EXIT, position);
    }
}
