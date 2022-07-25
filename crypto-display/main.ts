function getCryptoPrice(): Promise<number> {

    return new Promise((resolve, reject) => {

        // 500ms +/- 200ms => 300 ~ 700 ms
        const delay = 300 + (Math.random() * 400)

        // random around 1000 - 3000
        const value = 1e3 + Math.random() * 2e3

        setTimeout(() => {

            if (Math.random() > .1) {

                resolve(value)
            } else {
                reject('impossible de se connecter')
            }
        }, delay);
    })
}

function mainMutable() {

    const btn = document.createElement('button')

    btn.style.backgroundColor = '#5086bd' // blueish
    const priceContainer: HTMLSpanElement = document.createElement('span')
    const previousPriceContainer: HTMLSpanElement = document.createElement('span')

    const errorMsgContainer: HTMLSpanElement = document.createElement('span')
    errorMsgContainer.style.color = 'red'

    const historyContainer: HTMLDivElement = document.createElement('div')
    const history: number[] = []

    btn.innerText = "Afficher prix"

    btn.addEventListener('click', (e: Event) => {
        console.log(e) // PointerEvent
        btn.disabled = true
        errorMsgContainer.remove()
        getCryptoPrice().then(val => {console.log("prix = ", val)
        btn.style.backgroundColor = '#be3abe' // light purple
        btn.disabled = false
        if (history.length == 0) {
            document.body.appendChild(priceContainer)
            document.body.appendChild(historyContainer)
        }
        if (history.length == 1) {
            document.body.insertBefore(previousPriceContainer, priceContainer)
        }
        const historyEntry = document.createElement('span')
        historyEntry.innerText = String(val)
        historyContainer.prepend(historyEntry)
        history.push(val)
        priceContainer.innerText = `prix actuel = ${history[history.length - 1]}`
        previousPriceContainer.innerText = `prix précédent = ${history[history.length - 2]}`

    }).catch(e => { 
        console.error(e),
        btn.disabled = false,
        errorMsgContainer.innerText = e
        btn.after(errorMsgContainer)
        // document.body.append(errorMsgContainer)
    })
    
})
    document.body.appendChild(btn)
}

mainMutable()