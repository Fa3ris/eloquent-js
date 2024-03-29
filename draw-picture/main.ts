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
            right: number,
    },
        pos: {
            x: number,
            y: number
        }
}) : void
}


function createElement(name: string, attributes: {[name: string]: string}, props: {[name: string] : any}, ...children: (Node | string)[]): HTMLElement {

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

    picture: Picture // cannot be null
    
    isMouseDragging: boolean = false
    isMouseDown: boolean = false

    oldMouseDown = {
        x : 0,
        y: 0
    }

    tool?: Tool

    pictureUpdatedFn;

    constructor(picture: Picture, pictureUpdatedFn: (picture: Picture) => void) {
        this.pictureUpdatedFn = pictureUpdatedFn
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

                    const pixelX = Math.floor((event.clientX - canvasRectRelativeToViewport.x) / Canvas.SCALE)
                    const pixelY = Math.floor((event.clientY - canvasRectRelativeToViewport.y) / Canvas.SCALE)

                    this.tool?.draggingReleased?.({

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

            ontouchstart: (event: any) => this.touch(event)

        }) as HTMLCanvasElement

        this.dom.width = picture.w * Canvas.SCALE
        this.dom.height = picture.h * Canvas.SCALE

        // do not add to History
        this.picture = picture
        drawPicture(picture, this.dom, Canvas.SCALE)

    }

    syncState(picture: Picture) {
        this.pictureUpdatedFn(this.picture)
        drawPicture(picture, this.dom, Canvas.SCALE, this.picture)
        this.picture = picture
    }

    touch(event: any) {
        throw new Error("Method not implemented.")
    }
}

function drawPicture(picture: Picture, canvas: HTMLCanvasElement, scale: number, oldPicture?: Picture) {

    const ctx = canvas.getContext('2d')

    if (ctx == null) { return }

    if (oldPicture) {
        console.log('partial draw')
        for (let {x, y, pixel} of pictureDiff(picture, oldPicture)) {
            ctx.fillStyle = pixel
            ctx.fillRect(x * scale, y * scale, scale, scale)
        }
    } else {
        console.log('complete draw')
        for (let x = 0; x < picture.w; x++) {
            for (let y = 0; y < picture.h; y++) {
                ctx.fillStyle = picture.pixel(x, y)
                ctx.fillRect(x * scale, y * scale, scale, scale)
            }
        }
    }
}

function pictureDiff(newP: Picture, oldP: Picture): {x: number, y: number, pixel: Color}[] {

    const diff = []
    for (let x = 0; x < newP.w; x++) {
        for (let y = 0; y < newP.h; y++) {
            const pixel = newP.pixel(x, y)
            if (oldP.pixel(x, y) !== pixel) {
                diff.push({
                    x, y, pixel: pixel
                })
            }
        }
    }
    return diff
}


const hexDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f']


function randomColor(): Color {

    const digits: string[] = []

    for (let i = 0; i < 6; i++) {
        digits.push(hexDigits[Math.floor(Math.random() * hexDigits.length)])
    }

    return `#${digits.join('')}`
}



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

         drawPicture(newPicture, this.canvas.dom, Canvas.SCALE, this.canvas.picture)

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
            
        drawPicture(newPicture, this.canvas.dom, Canvas.SCALE, this.canvas.picture)

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

class Fill implements Tool {

    canvas : Canvas

    color: Color

    constructor(canvas: Canvas, color: Color) {
        this.canvas = canvas

        this.color = color
    }

    _fill(data: { pos: { x: number; y: number } }): void {
        const t0 = performance.now()
        const srcColor = this.canvas.picture.pixel(data.pos.x, data.pos.y)

        console.log('fill for srcColor', srcColor)

        if (srcColor === this.color) {
            return
        }

        const queue: {x: number, y: number}[] = []

        queue.push({x: data.pos.x , y: data.pos.y})

        let picture = this.canvas.picture;

        /* 
            top 0 -1
            right +1 0
            left -1 0
            bottom 0 +1
        */
        const directions = [
            {dx : 0, dy: -1},
            {dx : 1, dy: 0},
            {dx : -1, dy: 0},
            {dx : 0, dy: 1},

        ]

        while (queue.length > 0) {

            const pixel = queue.shift()
            if (!pixel) break

            picture = picture.draw([{x : pixel.x, y: pixel.y, pixel: this.color}])

            for (let {dx, dy} of directions) {

                const pixelCandidate = {
                    x: pixel.x + dx,
                    y: pixel.y + dy
                }

                if (pixelCandidate.x < 0 || pixelCandidate.x >= picture.w 
                    || pixelCandidate.y < 0 || pixelCandidate.y >= picture.h) {
                    continue
                }

                const color = picture.pixel(pixelCandidate.x, pixelCandidate.y)

                if (color === srcColor) {
                    queue.push(pixelCandidate)
                }
            }
        }
        this.canvas.syncState(picture)

        console.log('finish fill', performance.now() - t0)

    }

    clicked(data: { pos: { x: number; y: number } }): void {
        this._fill(data)
    }

    draggingReleased(data: {
        pos :{ x: number, y: number }
    }) {
        this._fill(data)
    }

}


function toHexString(n: number) {
    return n.toString(16).padStart(2, "0")
}


function pixelEditor() {

const undoHistory: Picture[] = []
const redoHistory: Picture[] = []


const picture = Picture.randomPicture(5, 8)

function pictureUpdatedFn(picture: Picture) {
    redoHistory.length = 0
    undoHistory.push(picture)
    syncState()
}

const canvas = new Canvas(picture, pictureUpdatedFn)


const undoButton: HTMLButtonElement = createElement("button", {
}, {

    onclick: () => {
        
        console.group('undo start')
        console.log('undo - undo hist', undoHistory)
        console.log('undo - redo hist', redoHistory)
        console.groupEnd()

        const picture = undoHistory.pop()
        if (picture) {
            redoHistory.push(canvas.picture)
            drawPicture(picture, canvas.dom, Canvas.SCALE, canvas.picture)
            canvas.picture = picture
            syncState()
        }

        console.group('undo end ',)
        console.log('undo - undo hist', undoHistory)
        console.log('undo - redo hist', redoHistory)
        console.groupEnd()
     
    },

}, 

'Undo') as HTMLButtonElement


const redoButton: HTMLButtonElement = createElement("button", {
}, {
    onclick: () => {

        console.group('redo start',)
        console.log('redo - undo hist', undoHistory)
        console.log('redo - redo hist', redoHistory)
        console.groupEnd()

        const picture = redoHistory.pop()
        if (picture) {
            undoHistory.push(canvas.picture)
            drawPicture(picture, canvas.dom, Canvas.SCALE, canvas.picture)
            canvas.picture = picture
            syncState()
        }

        console.group('redo end', )
        console.log('redo - undo hist', undoHistory)
        console.log('redo - redo hist', redoHistory)
        console.groupEnd()
    }
},
'Redo') as HTMLButtonElement


function syncState() {
    undoButton['disabled'] = undoHistory.length <= 0
    redoButton['disabled'] = redoHistory.length <= 0
}

const initColor = randomColor()

const drawTool = new Draw(canvas, initColor)
const rectTool = new Rect(canvas, initColor)
const fillTool = new Fill(canvas, initColor)

canvas.tool = drawTool

const select = createElement("select", {}, {

    onchange: (change: Event) => {

        const select: HTMLSelectElement = change.target as HTMLSelectElement

        switch(select.options[select.options.selectedIndex].value) {
            case 'draw':
                canvas.tool = drawTool
                break
            case 'rect':
                canvas.tool = rectTool
                break
            case 'fill':
                canvas.tool = fillTool
                break
            default:
                break
        }
    }
}, 

createElement("option", {value: 'draw'}, {}, 'pen'),
createElement("option", {value: 'fill'}, {}, 'fill'),
createElement("option", {value: 'rect'}, {}, 'rectangle'),

) as HTMLSelectElement


const colorPicker = createElement("input", {
    type: 'color',
    value: initColor
}, 

{
    oninput: (input: Event) => {
        const color = (input.target as HTMLInputElement).value as string
        drawTool.color = color
        rectTool.color = color
        fillTool.color = color
    }
}) as HTMLInputElement


const saveButton = createElement("button", {}, {

    onclick: () => {
        const saveCanvas = createElement("canvas", {}, {}) as HTMLCanvasElement;
        drawPicture(canvas.picture, saveCanvas, 1);
        const link = createElement("a", {
          href: saveCanvas.toDataURL(),
          download: "pixelart.png"
        }, {});
        document.body.appendChild(link);
        link.click();
        link.remove();
    }
}, 

'Save image')


const loadButton = createElement("button", {}, {

    onclick: () => {
        console.log('load image')

        const fileInput = createElement("input", {
            type: "file",
            accept: "image/png"
        },
        
        {}) as HTMLInputElement

        fileInput.oninput = function(e)  {

            const file = fileInput.files?.[0]

            if (file == null) { return }

            const fileReader = new FileReader()

            fileReader.onload = () => {
                const img = createElement("img", {
                    
                }, {
                    onload : () => {

                        // constrain width to current picture
                        const width = canvas.picture.w;
                        const height = canvas.picture.h;

                        const tempCanvas = createElement("canvas", {}, {width, height}) as HTMLCanvasElement

                        const ctx = tempCanvas.getContext('2d')

                        ctx?.drawImage(img, 0, 0)

                        const imgData = ctx?.getImageData(0, 0, width, height)

                        if (!imgData) { return }

                        const pixels = []
                        for (let i = 0; i < imgData?.data.length;) {

                            const r = imgData.data[i++]
                            const g = imgData.data[i++]
                            const b = imgData.data[i++]
                            const a = imgData.data[i++]

                            const color = `#${toHexString(r)}${toHexString(g)}${toHexString(b)}`

                            pixels.push(color)
                        } 

                        const picture = new Picture(width, height, pixels)

                        canvas.syncState(picture)
                        
                    },

                    src: fileReader.result,
                }) as HTMLImageElement
            }
            fileReader.readAsDataURL(file)
        }

        document.body.append(fileInput)

        fileInput.click()
        fileInput.remove()
        


    }
}, 

'Load image')


const canvasScaleInput = createElement("input", {
    type: 'number',
}, {
    oninput: (e: any) => {
        console.log('scale change', e.target.value)
        if (!e.target.value || e.target.value < 10 || e.target.value > 70) { return }
        Canvas.SCALE = e.target.value
        canvas.dom.width = canvas.picture.w * Canvas.SCALE
        canvas.dom.height = canvas.picture.h * Canvas.SCALE
        drawPicture(canvas.picture, canvas.dom, e.target.value)
    },

    value: Canvas.SCALE,
    min: 10,
    max: 70
}, 

'scale')

syncState()

const dom = createElement("div", {}, {
    tabIndex: 0,
})


bindKeyAction(dom , 'z', () => {
    undoButton.click()
}, true)

bindKeyAction(dom , 'y', () => {
    redoButton.click()
}, true)

bindKeyAction(dom, 's', () => {
    saveButton.click()
})

bindKeyAction(dom, 'l', () => {
    loadButton.click()
})

bindKeyAction(dom, 'c', () => {
    colorPicker.click()
})

bindKeyAction(dom, 't', () => {
    select.focus()
})


dom.append(canvas.dom)
dom.append(select)
dom.append(colorPicker)
dom.append(saveButton)
dom.append(loadButton)
dom.append(undoButton)
dom.append(redoButton)
dom.append(canvasScaleInput)

document.body.append(dom)

}


function bindKeyAction(dom: HTMLElement, key: string,  action: () => void, needCtrlPressed = false) {

    let pressed = false;

    dom.addEventListener('keydown', function (e: KeyboardEvent) {
        if (needCtrlPressed && !e.ctrlKey) { return }

        if (e.key === key && !pressed) {
            pressed = true
            action()
        }
    })

    dom.addEventListener('keyup',  function(e: KeyboardEvent) {
        if (e.key === key) {
            pressed = false
        }
    })
}

pixelEditor()