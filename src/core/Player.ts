import { Character } from "./Character"
import { DisplayObjectEvents } from "pixi.js"

export interface IPlayer {
    id: string
    name: string
    char_id: number
    level: number
    gender: number
    race: number
    x: number
    y: number
    map_id: string
}

export class Player implements IPlayer{
    id: string
    name: string
    char_id: number
    level: number
    gender: number
    race: number
    x: number
    y: number
    map_id: string

    character: Character

    constructor(data: IPlayer) {
        Object.assign(this, data)
        this.character = new Character(this.char_id)
        this.character.position.set(this.x, this.y)
    }

    toJson() {
        return {}
    }
}