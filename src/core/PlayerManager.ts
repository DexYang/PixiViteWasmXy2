
import { Player } from "./Player"
import { ResourceLoader } from "./ResourceLoader"
import SceneManager from "./SceneManager"

export class PlayerManager {
    private static instance: PlayerManager

    local: Map<string, Map<string, Player>>

    local_player: Map<string, Player>

    main_player: Player

    other_player: Map<string, Player>

    res: ResourceLoader

    scm = SceneManager.getInstance()

    constructor() {
        this.res = ResourceLoader.getInstance()
        this.other_player = new Map()
        // 读取本地存储到local
    }

    loginOrRegister(username: string) {
        if (username in this.local) {
            // 登录
        } else {
            // 注册
            this.local[username] = new Map()
        }
    }

    selectPlayer(player_id: string) {
        this.main_player = new Player({
            id: "1",
            name: "test",
            char_id: 1,
            level: 0,
            gender: 1,
            race: 1,
            map_id: "newscene/1410.map",
            x: 500,
            y: 500
        })
    }

    async intoWorld() {
        await this.scm.switchScene("World", this.main_player.map_id)
        
    }

    public static getInstance() {
        if (!PlayerManager.instance) {
            PlayerManager.instance = new PlayerManager()
        }
      
        return PlayerManager.instance
    }
}