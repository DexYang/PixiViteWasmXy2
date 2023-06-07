import { DisplayObject, Sprite } from "pixi.js"

export function centerObjects(...toCenter: DisplayObject[]) {
  const center = (obj: DisplayObject) => {
    obj.x = window.innerWidth / 2
    obj.y = window.innerHeight / 2

    if (obj instanceof Sprite) {
      obj.anchor.set(0.5)
    }
  }

  toCenter.forEach(center)
}

export function centerObject(obj: DisplayObject, offset_x = 0, offset_y = 0, center_anchor = true) {
  obj.x = window.innerWidth / 2
  obj.y = window.innerHeight / 2

  if (center_anchor && obj instanceof Sprite) {
    obj.anchor.set(0.5)
  }

  obj.x += offset_x
  obj.y += offset_y
}

export function wait(seconds: number) {
  return new Promise<void>((res) => setTimeout(res, seconds * 1000))
}

export async function after(
  seconds: number,
  callback: (...args: unknown[]) => unknown
) {
  await wait(seconds)
  return callback()
}

export function getEntries<T extends object>(obj: T) {
  return Object.entries(obj) as Entries<T>
}
