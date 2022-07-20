import { Entity } from "../game/entities";
import { Level, levelChars } from "../game/level.js";
import { State } from "../main.js";

export interface Renderer {
    
    clear(): void
    syncState(state: State): void
}

export type RendererConstructor = new(parent: HTMLElement, level: Level) => Renderer

export class DOMRenderer implements Renderer {

    dom: HTMLElement

    entityLayer: HTMLElement | null
    debugLayer: HTMLElement | null

    grid: HTMLElement

    private parentElt: HTMLElement

    static readonly DEBUG = false

    constructor(parentElt: HTMLElement, level: Level) {
        this.grid = drawGrid(level)
        this.dom = createElement("div", {class: "game"}, this.grid)
        this.dom.style.width = `${level._width * SCALE}px`
        this.parentElt = parentElt
        parentElt.appendChild(this.dom)
        this.entityLayer = null
        this.debugLayer = null
    }

    clear() {
        this.dom.remove()
        if (DOMRenderer.DEBUG && this.debugLayer) {this.debugLayer.remove()}
    }

    syncState(state: State) {
        if (this.entityLayer) { this.entityLayer.remove() }
        if (DOMRenderer.DEBUG && this.debugLayer) {this.debugLayer.remove()}
        this.entityLayer = drawEntities(state.entities)
        if (state.status === 'win') {
            this.entityLayer.classList.add('win')
        } else if (state.status === 'lose') {
            this.entityLayer.classList.add('lose')
        }
        this.dom.appendChild(this.entityLayer)

        if (DOMRenderer.DEBUG) {

            this.debugLayer = createElement('div', {class: "debug"})
            state.entities.forEach(e => {
                if (e.debugStr) {
                    (<HTMLElement> this.debugLayer).appendChild(createElement("div",{}, new Text(e.debugStr())))
                }
            })
        }

        DOMRenderer.DEBUG && this.debugLayer && this.parentElt.append(this.debugLayer)

        const viewportW = this.dom.clientWidth
        const viewportH = this.dom.clientHeight
        const margin = viewportW / 3

        const viewportLeft = this.dom.scrollLeft
        const viewportTop = this.dom.scrollTop
        const viewportRight = viewportLeft + viewportW
        const viewportBottom = viewportTop + viewportH

        const player = state.player
        const targetCenter = player.pos.add(player.size.mul(0.5)).mul(SCALE)

        // center viewport around player

        if (false)
        if (targetCenter.x < viewportLeft + margin) { // trop a gauche
            this.dom.scrollLeft = targetCenter.x - margin
        } else if (targetCenter.x > viewportRight - margin) { // trop a droite
            this.dom.scrollLeft = targetCenter.x - viewportW + margin
        }
        
        this.dom.scrollLeft = targetCenter.x - margin

        if (targetCenter.y < viewportTop + margin) {
            this.dom.scrollTop = targetCenter.y - margin
        } else if (targetCenter.y + margin > viewportBottom) {
            this.dom.scrollTop = targetCenter.y - viewportH + margin
        }
    }
}

function createElement(name: string, attributes: {[name: string]: string}, ...children: Node[]): HTMLElement {

    const elt = document.createElement(name);
    for (let entry of Object.entries(attributes)) {
        elt.setAttribute(entry[0], entry[1])
    }
    for (let child of children) {
        elt.appendChild(child)
    }
    return elt
} 

const SCALE = 20;


function drawGrid(level: Level): HTMLElement {

    const grid = level._state.map(row => {
        return createElement('tr', {
            style: `height: ${SCALE}px`
        }, ...row.map(type => createElement("td", {class: type})))
    })
    return createElement("table", {
        class: 'background',

    }, ...grid)
}

function drawEntities(entities: Entity[]): HTMLElement {
    return createElement("div", { class: "entity-layer"},
        ...entities.map((entity) => {

            const rect = createElement("div", {class : `entity ${entity.type}`})
            rect.style.height = `${entity.size.y * SCALE}px`
            rect.style.width = `${entity.size.x * SCALE}px`
            rect.style.left = `${entity.pos.x * SCALE}px`
            rect.style.top = `${entity.pos.y * SCALE}px`
            return rect
        })
    )
}

export class EditorRenderer {

    dom: HTMLElement

    help: HTMLElement

    parentElt: HTMLElement
    constructor(parentElt: HTMLElement) {
        this.dom = createElement("div", {class: "editor"})
        this.parentElt = parentElt
        this.help = createElement("div", {class: "help"}, 
            new Text("'d' : toggle editor mode")
        )
        this.parentElt.append(this.help)
    }
    
    display(level: Level) {
        this.dom.appendChild( new Text("editor"))
        const plan = level._plan

        
        plan.split('\n').map((rowString, rowIndex) => {
            
            const row = document.createElement('div');

            [...rowString].map((char, colIndex) => {
                const input = document.createElement('input')
                input.type = 'text'
                input.value = char
                input.maxLength = 1
                input.style.textAlign = 'center'
                input.style.width = '20px'
                input.dataset.row = String(rowIndex);
                input.dataset.col = String(colIndex);
                input.addEventListener('input', (e: Event) =>  {
                    const t = e.target as HTMLInputElement
                    e.stopPropagation()
                    if (!t.value) { return } // empty input
                    const i = rowIndex * (level._width + 1) + colIndex
                    if (!(t.value in levelChars)) { 
                        console.log('invalid char', t.value, 'reset to', plan.charAt(i))
                        t.value = plan.charAt(i)
                        return 
                    }

                    console.log('replace', plan.charAt(i), 'by', t.value)
                    const newPlan = plan.substring(0, i) + t.value + plan.substring(i + 1);
                    this.clear()
                    this.display(new Level(newPlan))
                })
                // prevent keys to trigger document handler e.g. pause, debug
                input.addEventListener('keydown', (e: Event) =>  {
                    e.stopPropagation()
                })

                input.addEventListener('keyup', (e: Event) =>  {
                    e.stopPropagation()
                })
                return input
            }).forEach(inputNode => {
                row.appendChild(inputNode)
            })
            return row
        }).forEach(row => {
            this.dom.appendChild(row)
        })
        console.log(plan)
        const planStringContainer = document.createElement('div');

        planStringContainer.style.letterSpacing = '.5em'
        planStringContainer.style.fontFamily = 'Consolas'
        planStringContainer.style.padding = '2em'
        planStringContainer.innerHTML = plan.trim().replace(/\n/g, '<br>')
        this.dom.appendChild(planStringContainer)

        const copyBtn = document.createElement('button')
        copyBtn.textContent = "copy"
        
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(planStringContainer.innerText)
        })

        this.dom.appendChild(copyBtn)
        this.parentElt.appendChild(this.dom)
    }

    clear() {
        while(this.dom.firstChild) {
            this.dom.removeChild(this.dom.firstChild)
        }
        this.dom.remove()
    }

}
