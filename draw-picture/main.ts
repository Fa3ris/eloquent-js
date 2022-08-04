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


interface Tool {

    mouseDown?: (data: {pos: {x: number, y: number}}) => void;


    dragging?(data: {
        rect: {
            top: number,
            bottom: number,
            left: number,
            right: number
    },
        pos: {
            x: number,
            y: number
        }

    }) : void


    clicked?(data: {
        pos: {
            x: number,
            y: number
        }
    }) : void

    draggingReleased?(data: {
        rect: {
            top: number,
            bottom: number,
            left: number,
            right: number
    }}) : void
}


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

    picture!: Picture // cannot be null
    
    isMouseDragging: boolean = false
    isMouseDown: boolean = false

    oldMouseDown = {
        x : 0,
        y: 0
    }

    tool?: Tool

    constructor(picture: Picture, pointerDownCallback: () => void) {
        this.dom = createElement('canvas', {}, {
            onmousedown: (event: MouseEvent) => { 
                if (event.button != 0) {
                    console.log('ignore mouse button down', event.button)
                    return
                }
                this.isMouseDown = true
                this.oldMouseDown.x = event.clientX
                this.oldMouseDown.y = event.clientY

                this.tool?.mouseDown?.({ pos: {x: event.clientX, y: event.clientY}})
            },
            onmouseup: (event: MouseEvent) => { 
                console.log('mouse up', event)
                if (event.button != 0) {
                    console.log('ignore mouse button up', event.button)
                    return
                }
                if (this.isMouseDragging) {

                    const top = Math.min(event.clientY, this.oldMouseDown.y)
                    const left = Math.min(event.clientX, this.oldMouseDown.x)

                    const bottom = Math.max(event.clientY, this.oldMouseDown.y)
                    const right = Math.max(event.clientX, this.oldMouseDown.x)

                    const canvasRectRelativeToViewport = this.dom.getBoundingClientRect()

                    const pixelXMin = Math.floor((left - canvasRectRelativeToViewport.x) / Canvas.SCALE)
                    const pixelXMax = Math.floor((right - canvasRectRelativeToViewport.x) / Canvas.SCALE)

                    const pixelYMin = Math.floor((top - canvasRectRelativeToViewport.y) / Canvas.SCALE)
                    const pixelYMax = Math.floor((bottom - canvasRectRelativeToViewport.y) / Canvas.SCALE)

                    this.tool?.draggingReleased?.({

                        rect: {
                            top: pixelYMin,
                            bottom: pixelYMax,
                            left: pixelXMin,
                            right: pixelXMax
                        }
                    })

                 
                } else { // simple click

                    const xRelativeToViewport = event.clientX
                    const yRelativeToViewport = event.clientY
            
                    const canvasRectRelativeToViewport = this.dom.getBoundingClientRect()
            
                    const pixelX = Math.floor((xRelativeToViewport - canvasRectRelativeToViewport.x) / Canvas.SCALE)
                    const pixelY = Math.floor((yRelativeToViewport - canvasRectRelativeToViewport.y) / Canvas.SCALE)
            
                    this.tool?.clicked?.({
                        pos: {
                            x: pixelX,
                            y: pixelY,
                        }
                    })

                   
                }
                this.isMouseDown = false
                this.isMouseDragging = false
            },
            onmousemove: (event: MouseEvent) => { 
                if (this.isMouseDown && !this.isMouseDragging) {
                    console.log('mouse move', event)
                    this.isMouseDragging = true
                }

                if (this.isMouseDragging) {

                    const top = Math.min(event.clientY, this.oldMouseDown.y)
                    const left = Math.min(event.clientX, this.oldMouseDown.x)

                    const bottom = Math.max(event.clientY, this.oldMouseDown.y)
                    const right = Math.max(event.clientX, this.oldMouseDown.x)

                    const canvasRectRelativeToViewport = this.dom.getBoundingClientRect()

                    const pixelXMin = Math.floor((left - canvasRectRelativeToViewport.x) / Canvas.SCALE)
                    const pixelXMax = Math.floor((right - canvasRectRelativeToViewport.x) / Canvas.SCALE)

                    const pixelYMin = Math.floor((top - canvasRectRelativeToViewport.y) / Canvas.SCALE)
                    const pixelYMax = Math.floor((bottom - canvasRectRelativeToViewport.y) / Canvas.SCALE)

                    const pixelX = Math.floor((event.clientX - canvasRectRelativeToViewport.x) / Canvas.SCALE)
                    const pixelY = Math.floor((event.clientY - canvasRectRelativeToViewport.y) / Canvas.SCALE)

                    this.tool?.dragging?.({
                        rect: {
                            top: pixelYMin,
                            bottom: pixelYMax,
                            left: pixelXMin,
                            right: pixelXMax
                        },
                        pos: {
                            x: pixelX,
                            y: pixelY
                        }
                    })
                }
            },

            ontouchstart: (event: any) => this.touch(event, pointerDownCallback)

        }) as HTMLCanvasElement

        this.syncState(picture)

    }

    syncState(picture: Picture) {
        this.picture = picture
        drawPicture(picture, this.dom, Canvas.SCALE)
    }

    touch(event: any, pointerDownCallback: () => void) {
        throw new Error("Method not implemented.")
    }
}

function drawPicture(picture: Picture, canvas: HTMLCanvasElement, scale: number) {

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

class Rect implements Tool {

    canvas : Canvas

    color: Color

    constructor(canvas: Canvas, color: Color) {
        this.canvas = canvas
        this.color = color
    }

    dragging(data: {
        rect: {
            top: number; bottom: number;
            left: number; right: number
        },
        pos: {
            x: number,
            y: number
        }
    }): void {

        
        const newPixels = []
        for (let x = data.rect.left; x <= data.rect.right; x++) {
            for (let y = data.rect.top; y <= data.rect.bottom; y++) [
                newPixels.push({x, y, pixel: this.color})
            ]
        }

         const newPicture = this.canvas.picture.draw(newPixels)

         drawPicture(newPicture, this.canvas.dom, Canvas.SCALE)

    }


    draggingReleased(data: {
        rect: {
            top: number; bottom: number;
            left: number; right: number
        },
       
    }): void {


        const newPixels = []
        for (let x = data.rect.left; x <= data.rect.right; x++) {
            for (let y = data.rect.top; y <= data.rect.bottom; y++) [
                newPixels.push({x, y, pixel: this.color})
            ]
        }

        const newPicture = this.canvas.picture.draw(newPixels)

        this.canvas.syncState(newPicture)
    }

}


class Draw implements Tool {
    
    canvas : Canvas

    color: Color

    pixels: {x: number; y: number} [] = []

    constructor(canvas: Canvas, color: Color) {
        this.canvas = canvas

        this.color = color
    }

    dragging(data: {
        rect: {
            top: number; bottom: number;
            left: number; right: number
        },
        pos: {
            x: number,
            y: number
        }
    }): void {

        this.pixels.push({x: data.pos.x, y: data.pos.y})

        const newPicture = this.canvas.picture.draw( this.pixels.map(p => {
            return {...p, pixel: this.color}
        }))
            
        drawPicture(newPicture, this.canvas.dom, Canvas.SCALE)

    }

    clicked(data: { pos: { x: number; y: number } }): void {

        const newPicture = this.canvas.picture.draw([{x : data.pos.x, y: data.pos.y, pixel: this.color}])
            
        this.canvas.syncState(newPicture)
    }

    draggingReleased(data: {
        rect: {
            top: number; bottom: number;
            left: number; right: number
        },
       
    }): void {

        const newPicture = this.canvas.picture.draw( this.pixels.map(p => {
            return {...p, pixel: this.color}
        }))

        this.canvas.syncState(newPicture)
            
        this.pixels.length = 0
    }

}

const drawTool = new Draw(c, "#00ffa0")
const rectTool = new Rect(c, "#00ffa0")

c.tool = drawTool


document.body.append(c.dom)