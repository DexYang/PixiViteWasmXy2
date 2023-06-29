import { Container, Point, Ticker } from "pixi.js"
import { get_state, State } from "./State"
import  "@pixi/math-extras"
import { calcDirection8 } from "~/utils/misc"
import config from "~/config"

const states: Array<string> = ["stand", "stand2", "walk", "run"]

export class Character extends Container {
    direction: number

    states: Record<string, State>

    state: string

    char_id: number

    WDF = "shape.wdf"

    target: Point

    target_list: Array<Point>

    is_new_target: boolean

    is_running: boolean

    constructor(char_id: number) {
        super()
        this.char_id = char_id
        this.states = {}
        this.direction = 0
        this.target_list = []
        this.is_running = false
        this.is_new_target = false
    }

    async setup() {
        for (const index in states) {
            const state = states[index]
            this.states[state] = await get_state(state, this.WDF, this.getPath(state))
            this.addChild(this.states[state])
        }
        this.switchState("stand")
        Ticker.shared.add(() => this.update())
    }

    update() {
        if (this.isMovingToNewTarget()) return
        if (this.state === "run" || this.state === "walk") {
            if (this.target_list.length > 0) {
                if (this.isOnTarget()) {
                    const temp = this.target_list.shift()
                    console.log(temp)
                    if (temp) this.target = temp
                }
                this.calcDirection(this.target.x, this.target.y)
                this.move()
            } else if (this.isOnTarget()) {
                this.switchState("stand")
            } else {
                this.move()
            }
        }
    }

    setNewTarget(target_list: Array<Point>, is_running: boolean) {
        this.target_list = target_list
        this.is_running = is_running
        this.is_new_target = true
    }

    switchState(state: string) {
        if (this.state === state) return
        let _state: State
        if (this.state) {
            _state = this.states[this.state]
            _state.stop(this.direction) // 旧状态停止并隐藏
            _state.visible = false
        }
        this.state = state
        _state = this.states[this.state]
        _state.play(this.direction)
        _state.visible = true
    }

    changeDirection(d: number) {
        const _state: State = this.states[this.state]
        _state.stop(this.direction) // 旧状态停止并隐藏
        this.direction = d
        _state.play(this.direction)
    }

    getPath(state: string) {
        return "char/" + ("000"+this.char_id).substr(-4) + "/" + state + ".tcp"
    }

    calcDirection(x:number, y:number) {
        const d = calcDirection8(this.position.x, this.position.y, x, y)
        if (this.direction !== d) {
            this.changeDirection(d)
        }
    }

    isMovingToNewTarget() {
        if (this.is_new_target) {
            this.switchState(this.is_running ? "run" : "walk")
            this.is_new_target = false
            this.target = this.position
            return true
        }
        return false
    }

    isOnTarget() {
        return this.position.subtract(this.target).magnitude() < 5
    }

    move() {
        const vec = this.target.subtract(this.position).normalize()
        if (isNaN(vec.x)  || isNaN(vec.y)) return
        const speed = this.is_running ? config.run_speed : config.walk_speed
        this.position.x += vec.x * speed
        this.position.y += vec.y * speed
    }
}


export async function get_character(char_id: number) {
    const c = new Character(char_id)
    await c.setup()
    return c
}