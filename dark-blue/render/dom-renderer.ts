import { Entity } from "../game/entities";
import { Level } from "../game/level.js";
import { State } from "../main.js";

export interface Renderer {
    
    clear(): void
    syncState(state: State): void
}

export type RendererConstructor = new(parent: Node, level: Level) => Renderer

export class DOMRenderer implements Renderer {

    dom: HTMLElement

    entityLayer: HTMLElement | null
    debugLayer: HTMLElement | null

    grid: HTMLElement

    constructor(parentElt: Node, level: Level) {
        this.grid = drawGrid(level)
        this.dom = createElement("div", {class: "game"}, this.grid)
        this.dom.style.width = `${level._width * SCALE}px`
        parentElt.appendChild(this.dom)
        this.entityLayer = null
        this.debugLayer = null
    }

    clear() {
        this.dom.remove()
    }

    syncState(state: State) {
        if (this.entityLayer) { this.entityLayer.remove() }
        if (this.debugLayer) {this.debugLayer.remove()}
        this.entityLayer = drawEntities(state.entities)
        this.dom.appendChild(this.entityLayer)

        this.debugLayer = createElement('div', {class: "debug"})
        state.entities.forEach(e => {
            if (e.debugStr) {
                (<HTMLElement> this.debugLayer).appendChild(createElement("div",{}, new Text(e.debugStr())))
            }
        })

        this.dom.append(this.debugLayer)
        const playerElt = this.dom.getElementsByClassName("entity player")[0] 
        playerElt.scrollIntoView()
        console.log('scrolled into view', playerElt)
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
