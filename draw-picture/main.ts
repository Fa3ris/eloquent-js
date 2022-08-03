console.log('draw PICTURE')


type Color = string // '#aabbcc'

type Pixel = Color

class Picture {
    w: number
    h: number
    pixels: Pixel[]

    constructor(w: number, h: number, pixels: Pixel[]) {
        this.w = w
        this.h = h
        this.pixels = pixels
    }

    pixel(x: number, y: number): Pixel {
        return this.pixels[y * this.w + x]
    }

    static emptyPicture(w: number, h: number, fillColor: Color) : Picture {
        return new Picture(w, h, new Array(w * h).fill(fillColor))
    }

    static randomPicture(w: number, h: number) : Picture {

        const pixels = new Array(w * h)
        for (let i = 0; i < pixels.length; i++) {
            pixels[i] = randomColor()
        }
        return new Picture(w, h, pixels)
    }

    draw(newPixels: {x: number, y: number, pixel: Pixel}[]): Picture {

        const copy = this.pixels.slice() 
        for (let {x, y, pixel} of newPixels) {
            copy[y * this.w + x] = pixel
        }
        return new Picture(this.w, this.h, copy)
    }
}

type State = {
    picture: Picture,
    tool: Tool,
    color: Color
}

type Action = State

type Tool = any


function updateState(state: State, action: Action): State {
    return Object.assign({}, state, action)
}


function createElement(name: string, attributes: {[name: string]: string}, props: {[name: string] : any}, ...children: Node[]): HTMLElement {

    const elt = document.createElement(name);
    for (let entry of Object.entries(attributes)) {
        elt.setAttribute(entry[0], entry[1])
    }
    if (props) {
        Object.assign(elt, props)
    }
    for (let child of children) {
        if (typeof child === 'string') {
            child = document.createTextNode(child)
        }
        elt.appendChild(child)
    }
    return elt
}


class Canvas {

    static SCALE = 30;

    dom: HTMLCanvasElement

    picture: Picture
    
    isMouseDragging: boolean = false
    isMouseDown: boolean = false

    oldMouseDown = {
        x : 0,
        y: 0
    }

    constructor(picture: Picture, pointerDownCallback: () => void) {
        this.dom = createElement('canvas', {}, {
            onmousedown: (event: MouseEvent) => { 
                this.isMouseDown = true
                this.oldMouseDown.x = event.clientX
                this.oldMouseDown.y = event.clientY
            },
            onmouseup: (event: MouseEvent) => { 
                console.log('mouse up', event)
                if (!this.isMouseDragging) {
                    this.mouseClicked(event, pointerDownCallback)
                } else {

                    const top = Math.min(event.clientY, this.oldMouseDown.y)
                    const left = Math.min(event.clientX, this.oldMouseDown.x)

                    const bottom = Math.max(event.clientY, this.oldMouseDown.y)
                    const right = Math.max(event.clientX, this.oldMouseDown.x)

                    const canvasRectRelativeToViewport = this.dom.getBoundingClientRect()

                    const pixelXMin = Math.floor((left - canvasRectRelativeToViewport.x) / Canvas.SCALE)
                    const pixelXMax = Math.floor((right - canvasRectRelativeToViewport.x) / Canvas.SCALE)

                    const pixelYMin = Math.floor((top - canvasRectRelativeToViewport.y) / Canvas.SCALE)
                    const pixelYMax = Math.floor((bottom - canvasRectRelativeToViewport.y) / Canvas.SCALE)

                    const newColor = randomColor()

                    const newPixels = []
                    for (let x = pixelXMin; x <= pixelXMax; x++) {
                        for (let y = pixelYMin; y <= pixelYMax; y++) [
                            newPixels.push({x, y, pixel: newColor})
                        ]
                    }

                    const newPicture = this.picture.draw(newPixels)

                    this.syncState(newPicture)

                }
                this.isMouseDown = false
                this.isMouseDragging = false
            },
            onmousemove: (event: any) => { 
                if (this.isMouseDown && !this.isMouseDragging) {
                    console.log('mouse move', event)
                    this.isMouseDragging = true
                }
            },
            ontouchstart: (event: any) => this.touch(event, pointerDownCallback)
        }) as HTMLCanvasElement

        
        this.picture = picture
        this.syncState(picture)

        document.body.append(this.dom)
    }

    syncState(picture: Picture) {
        this.picture = picture
        drawPicture(picture, this.dom, Canvas.SCALE)
    }

    touch(event: any, pointerDownCallback: () => void) {
        throw new Error("Method not implemented.")
    }

    mouseClicked(event: MouseEvent, pointerDownCallback: () => void) {

        if (event.button != 0) {
            console.log('ignore mouse button', event.button)
            return
        }
        const xRelativeToViewport = event.clientX
        const yRelativeToViewport = event.clientY

        const canvasRectRelativeToViewport = this.dom.getBoundingClientRect()

        const pixelX = Math.floor((xRelativeToViewport - canvasRectRelativeToViewport.x) / Canvas.SCALE)
        const pixelY = Math.floor((yRelativeToViewport - canvasRectRelativeToViewport.y) / Canvas.SCALE)
        console.log('mouse down', {px: pixelX, py: pixelY}, event)

        const newPicture = this.picture.draw([{x: pixelX, y: pixelY, pixel: randomColor()}])

        this.syncState(newPicture)
    }
}

function drawPicture(picture: Picture, canvas: HTMLCanvasElement, scale: number) {

    console.log('draw picture', picture, canvas, scale)
    canvas.width = picture.w * scale
    canvas.height = picture.h * scale

    const ctx = canvas.getContext('2d')

    if (ctx == null) { return }

    for (let x = 0; x < picture.w; x++) {
        for (let y = 0; y < picture.h; y++) {
            ctx.fillStyle = picture.pixel(x, y)
            ctx.fillRect(x * scale, y * scale, scale, scale)
        }
    }
}


const hexDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f']

// const p = Picture.emptyPicture(5, 8, randomColor())
const p = Picture.randomPicture(5, 8)


function randomColor(): Color {

    const digits: string[] = []

    for (let i = 0; i < 6; i++) {
        digits.push(hexDigits[Math.floor(Math.random() * hexDigits.length)])
    }

    return `#${digits.join('')}`
}

const c = new Canvas(p, () => {})