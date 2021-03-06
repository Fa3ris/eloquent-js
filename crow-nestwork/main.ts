import { performance } from 'perf_hooks';
console.log('crow network')

type CacheName = string;

type FoodCache = any;

type NestName = string;
type MessageType = 'note' | 'ping' | 'gossip' | 'connections' | 'route' | 'message' | 'ack' | 'storageQuery' | 'storageResponse'



/** 
 * ce que le noeud destinaire doit faire lorsqu'il reçoit un message
 */
type ResponseProducer = (dest: CrowNest, content: any, src: NestName) => any | Promise<any>

type MessageHandlingFinishedHandler = (error: any, value: any) => void

type MessageHandler = (dest: CrowNest, content: any, src: NestName, messageHandlingFinishedHandler: MessageHandlingFinishedHandler) => void

type NestStorage = Map<string, string>

const messageHandlers = new Map<MessageType, MessageHandler>()
const crowNests = new Map<NestName, CrowNest>()



class CrowNest {

    name: NestName

    gossips: Set<any> = new Set()

    storage: NestStorage;
    
    neighbors = new Set<NestName>()

    connections = new Map<NestName, {neighbors: Set<NestName>, date: number}>()

    chicksInfos = new Map<number, Map<NestName, number>>()

    constructor(name: NestName) {
        this.name = name
        this.storage = createStorageForNest(name)
    }

    private _readStorageCallback(key: string, callback: (entry: string | undefined) => void) {
        setTimeout(() => callback(this.storage.get(key)), 20)
    }

    readStoragePromise(key: string): Promise<string> {
        return new Promise((resolve, reject) => {
            this._readStorageCallback(key, (entry) => { 
                if (entry) resolve(entry)
                else reject("no entry found for key " + key)
            })
        })
    }

    /**
     * envoie le message à un voisin direct
     * 
     * trouve le messageHandler associé au type de message et l'exécute
     * 
     * appelle messageHandlingFinishedHandler une fois que le message a été traité par messageHandler
     * ou qu'un erreur est survenue
     * 
     * @param dest 
     * @param type 
     * @param content 
     * @param messageHandlingFinishedHandler 
     * @returns 
     */
    send(dest: NestName, type: MessageType, content: any, messageHandlingFinishedHandler: MessageHandlingFinishedHandler) {

        if (!this.neighbors.has(dest)) {
            messageHandlingFinishedHandler(new Error(dest + ' is not among neighbors of nest ' + this.name), undefined)
            return
        }
        const targetCrowNest = crowNests.get(dest)

        if (!targetCrowNest) {
            
            messageHandlingFinishedHandler(new Error('no crow nest found dest ' + dest), undefined)
            return
        }

        const messageHandler = messageHandlers.get(type)
        

        if (!messageHandler) {
            console.log('no handler for type', type)
            messageHandlingFinishedHandler(new Error('no handler found for message type ' + type), undefined)
            return
        }

        // simulate connection here - delay, no connect
        false && console.log('found message handler for', type)
        messageHandler(targetCrowNest, content, this.name, (error, value) => {
            if (false)
            setTimeout(() => {
                messageHandlingFinishedHandler(error, value)
            }, 250 + (-250 + (Math.random() * 260)))

            messageHandlingFinishedHandler(error, value)
        });

    }
}

/**
 * definit le messageHandler à utiliser pour un type de message
 * 
 * le messageHandler ne fait que transformer la reponse du producer en Promise et immediatement appeler 
 * messageHandlingFinishedHandler
 * @param type le type de message
 * @param responseProducer
 */
function defineRequestTypeHandlerPromise(type: MessageType, responseProducer: ResponseProducer) {
 
    const messageHandler : MessageHandler = (dest, content, src, messageHandlingFinishedHandler) => {
        false && console.log('handle message for', type)
        try {
            // quel intérêt ? mettre au même niveau les types de retour de responseProducer 
            // si responseProducer produit aussi une Promise, retourne cette même Promise
            // sinon retourne une nouvelle Promise
            // et permet aussi d'attendre une réponse asynchrone
            Promise.resolve(responseProducer(dest, content, src)).then(
                response => messageHandlingFinishedHandler(undefined, response),
                error => messageHandlingFinishedHandler(error, undefined))
        } catch (error) {
            console.log('response producer failed', error, {dest, type})
            messageHandlingFinishedHandler(error, undefined)
            return
        }
    }

    messageHandlers.set(type, messageHandler)
}

/**
 * envoie le contenu de nest vers dest
 * gère le retry
 * retourne une Promise qui resolve avec la reponse de dest, ou reject avec une erreur
 * @param nest 
 * @param dest 
 * @param type 
 * @param content 
 * @returns 
 */
function sendRequest(nest: CrowNest, dest: NestName, type: MessageType, content: any): Promise<any> {
    return new Promise((resolve, reject) => {
        let done = false
        let currentAttempt = 1;
        function attempt(n: number): void {

            const requestTimeoutHandler = () => {
                console.log({dest , type}, 'handle timeout for attempt', n, done)
                if (done) {
                    console.log({dest , type}, 'exit handle timeout for attempt', n, done)
                    return
                }
                if (n < 3) { // max attempts
                    currentAttempt = n + 1
                    console.log({dest , type}, 'retry attempt', currentAttempt, done)
                    attempt(currentAttempt)
                }
                else {
                    console.log({dest, type}, "exceed max attempts", n)
                    reject(new Error("attempt " + n + " timed out"))}
            }

            // need to get timeoutID before, else it may be undefined when call clearTimeout()
            const timeoutID = setTimeout(requestTimeoutHandler, 250); // timeout

            const messageHandlingFinishedHandler: MessageHandlingFinishedHandler = (failedReason, value) => {
                console.log('received response for', {dest, type}, {error: failedReason?.message, response: value})
                if (n !== currentAttempt) {
                    // response has arrived too late, ignore it
                    return
                }
                done = true
                console.log({dest , type}, 'cancel retry callback for attempt', n)
                clearTimeout(timeoutID)
                if (failedReason) { reject(failedReason) } 
                else { resolve(value) }
            }

            nest.send(dest, type, content, messageHandlingFinishedHandler)
           
        }
        attempt(currentAttempt)
    })
}




defineRequestTypeHandlerPromise('ping', () => "pong")



const sender =  new CrowNest('A')
sender.neighbors.add('B')

const bNest = new CrowNest('B')

const cNest = new CrowNest('C')

const dNest = new CrowNest('D')

const eNest = new CrowNest('E')

const nests: {[name: NestName]: CrowNest} = {
    'A' : sender,
    'B' : bNest,
    'C' : cNest,
    'D' : dNest,
    'E' : eNest
}

const ALL_NEST_NAMES = ['A', 'B', 'C', 'D', 'E']
for (let name of ALL_NEST_NAMES) {
    crowNests.set(name, new CrowNest(name))
}

const connections = ['A-B', 'B-C', 'C-D', 'B-E', 'C-E']

for (let connection of connections) {
    const [nest1, nest2] = connection.split('-')
    crowNests.get(nest1)?.neighbors.add(nest2)
    crowNests.get(nest2)?.neighbors.add(nest1)
}


const t0 = performance.now()

if (false)
sendRequest(sender, 'B', 'ping', undefined).then(response => {
    console.log('ping - delay', performance.now() - t0)
    console.log('ping -', response)
},
    error => {console.error('ping -', error)})

if (false)
sendRequest(sender, 'B', 'note', undefined).then(response => {
    console.log('note - delay', performance.now() - t0)
    console.log('note -', response)
},
    error => {console.error('note -', error.message)})


function requestPingTargets(sender: CrowNest, targets: NestName[]) {
    const promises: Promise<any>[] = []
    for (let pingTarget of targets) {
        promises.push(sendRequest(sender, pingTarget, 'ping', undefined)
            .then(() => true, () => false)
        )
    }
    
    Promise.all(promises).then(results => {
        console.log(results.map((value, i) => `${sender.name} ${value ? '---' : '-x-'} ${targets[i]}`
        ))
    })
}

if (false)
for (let senderName of ALL_NEST_NAMES) {
    requestPingTargets(crowNests.get(senderName) as CrowNest, ALL_NEST_NAMES.filter(dest => dest !== senderName))
}


defineRequestTypeHandlerPromise('gossip', (dest: CrowNest, content: any, src: NestName) => {

    console.log(dest.name, 'GOSSIP - ', content)

    if (dest.gossips.has(content)) {
        console.log(dest.name, 'ooo')
        return
    }

    dest.gossips.add(content)

    for (let neighbor of dest.neighbors) {
        if (neighbor === src) { 
            console.log(dest.name, '=x=>', neighbor, '-', content)
            continue
         }
        console.log(dest.name, '===>', neighbor, '-', content)
        sendRequest(dest, neighbor, 'gossip', content).catch(err => console.error('flooding failed', err.message))
    }
})


function sendGossip(sender: CrowNest, content: any) {

    if (sender.gossips.has(content)) {
        console.log(sender.name, 'already has gossip')
        return Promise.resolve("")
    }

    sender.gossips.add(content)

    const promises = []
    for (let neighbor of sender.neighbors) {
        promises.push(sendRequest(sender, neighbor, 'gossip', content))
    }
    return Promise.all(promises)
}


if (false)
sendGossip(crowNests.get('A') as CrowNest, "A is great").then(results => {
    console.log('flooding finished', results)

    for (let nest of crowNests.values()) {
        console.log(nest.name, Array.from(nest.gossips.values()))
    } 
    
}, err => {console.error('flooding failed', err)})


/**
 * propagate connections info of sender to all reachable nodes 
 * @param sender 
 */
function broadcastConnections(sender: CrowNest) {
    console.log(sender.neighbors)
    for (let neighbor of sender.neighbors) {
        sendRequest(sender, neighbor, 'connections', {
            name: sender.name,
            neighbors: new Set(sender.neighbors),
            date: performance.now()
        })
    }
}

defineRequestTypeHandlerPromise('connections', (dest: CrowNest, content: {name: NestName, neighbors: Set<NestName>, date: number}, src: NestName) => {

    console.log(dest.name, 'CONNECTIONS - ', content.name)

    const currentConnectionsInfo = dest.connections.get(content.name)

    // if info received has been emitted by dest or already has same or fresher connection info
    if (content.name === dest.name || (currentConnectionsInfo && currentConnectionsInfo.date >= content.date)) {
        console.log(dest.name, "STOP PROPAGATION", content.name)
        return
    }

    dest.connections.set(content.name, {neighbors: content.neighbors, date: content.date})

    for (let neighbor of dest.neighbors) {
        if (neighbor === src) { 
            console.log(dest.name, 'XXX', neighbor, '-', content.name)
            continue
         }
         console.log(dest.name, "[[[", neighbor)
        sendRequest(dest, neighbor, 'connections', content)
    }
})




for (let nest of crowNests.values()) {
    broadcastConnections(nest)
}

function printConnectionsRepeat(interval = 1000) {
   
    setInterval(() => {
        console.log("connectionsInfos")
        for (let nest of crowNests.values()) {
            console.log(nest.name, Array.from(nest.connections.entries()).map(entry => {return { node: entry[0], neighbors: Array.from(entry[1].neighbors.values())}}))
        } 


        const origin = crowNests.get('B') as CrowNest
        for (let target of ALL_NEST_NAMES) {
            try {
                process.stdout.write(`GATEWAY ${origin.name} -> ${target}: ${findGateway(origin, target)} \n`);
            } catch (e) {
    
            }
        }
    }, interval);
}

false && printConnectionsRepeat()


function findGateway(nest: CrowNest, target: NestName): NestName {
    const visited: Set<NestName> = new Set();
    const queue: {nest : NestName, gateway: NestName}[] = []

    if (nest.name === target) { return target }

    // check direct neighbor
    if (nest.neighbors.has(target)) {
        return target
    }

    visited.add(nest.name);

    // enqueue neighbors with gateway == neighbor
    for (let neighbor of nest.neighbors) {
        queue.push({nest: neighbor, gateway: neighbor})
    }

    while (queue.length > 0) {

        const dequeued = queue.shift()
        if (!dequeued) {
            console.error("queue is empty")
            throw 'no gateway found for target ' + target
        }

        if (dequeued.nest === target) {
            return dequeued.gateway as NestName
        }

        const neighbors = nest.connections.get(dequeued.nest)?.neighbors

        if (!neighbors) {
            console.log("dead end at", dequeued.nest)
            continue
        }

        for (let neighbor of neighbors) {
            if (visited.has(neighbor)) {
                continue
            }
            visited.add(neighbor)
            queue.push({nest: neighbor, gateway: dequeued.gateway})
        }
    }
    throw `no path found from ${nest.name} to ${target}`
}


function routeRequest(nest: CrowNest, content: {target: NestName, type: MessageType, content: any, src: NestName}): Promise<any> {
    
    false && console.log(nest.name, 'route request from', content.src, 'to', content.target)
    if (nest.neighbors.has(content.target)) {
        console.log(nest.name, 'route request from', content.src, 'to', content.target, 'directly')
        return sendRequest(nest, content.target, content.type, {content: content.content, src: content.src})
    } else {
        let gateway
        try {
            gateway = findGateway(nest, content.target)
        } catch (error) {
            return Promise.reject(error)
        }
        console.log(nest.name, 'route request from', content.src, 'to', content.target, 'via', gateway)
        return sendRequest(nest, gateway, 'route', content)
    }
}

defineRequestTypeHandlerPromise('route', (dest: CrowNest, content: {target: NestName, type: MessageType, content: any, src: NestName}, src: NestName): Promise<any> => {
    return routeRequest(dest, content)

})

defineRequestTypeHandlerPromise('message', (dest: CrowNest, content: {target: NestName, type: MessageType, content: {content: any, src: NestName}, src: NestName}, src: NestName) => {
    
    console.log(dest.name, 'received message from',  content)

    deliverAck(dest, content.src)
    return 'OK'

})

defineRequestTypeHandlerPromise('ack', (dest: CrowNest, content: {target: NestName, type: MessageType, content: {content: any, src: NestName}, src: NestName}, src: NestName) => {
    
    console.log(dest.name, 'received ack from',  content)
    return 'OK'

})

function deliverMessage(nest: CrowNest, target: NestName, content: any) {
    routeRequest(nest, {
        content: content,
        src: nest.name,
        target: target,
        type: 'message'
    }).catch(error => console.log('cannot deliver message', error))
}

function deliverAck(nest: CrowNest, target: NestName) {
    routeRequest(nest, {
        content: 'ACK',
        src: nest.name,
        target: target,
        type: 'ack'
    }).catch(error => console.log('cannot deliver message', error))
}

false && sendRequest(crowNests.get('A') as CrowNest, 'D', 'route', "from A: Hello D !!")

let msgCount = 0
false && setInterval(() => {

    ++msgCount
    deliverMessage(crowNests.get('A') as CrowNest, 'D', 'coucou D.' + msgCount)
    deliverMessage(crowNests.get('A') as CrowNest, 'B', 'coucou B.' + msgCount)
    deliverMessage(crowNests.get('A') as CrowNest, 'E', 'coucou E.' + msgCount)
    deliverMessage(crowNests.get('A') as CrowNest, 'F', 'coucou F.' + msgCount)
}, 1000)


function createStorageForNest(nest: NestName): NestStorage {
    const storage: NestStorage = new Map()

    storage.set("food caches", JSON.stringify(["cache in the oak", "cache in the meadow", "cache under the hedge"]))
    storage.set("cache in the oak", JSON.stringify("A hollow above the third big branch from the bottom. Several pieces of bread and a pile of acorns."))
    storage.set("cache in the meadow",  JSON.stringify("Buried below the patch of nettles (south side). A dead snake."))
    storage.set("cache under the hedge", JSON.stringify("Middle of the hedge at Gilles' garden. Marked with a forked twig. Two bottles of beer."))
    storage.set("enemies", JSON.stringify(["Farmer Jacques' dog", "The butcher", "That one-legged jackdaw", "The boy with the airgun"]))


    if (nest === 'D') {
        storage.set('treasure', JSON.stringify('Laugh Tale'))
    }

    for (let year = 1970; year <= 2022; year++) {
        storage.set(`chicks-${year}`, JSON.stringify(computeChicksEntry(nest, year)))
    }

    return storage
}

function computeChicksEntry(nest: NestName, year: number): number {

    let hash = 0

    for (let i = 0; i < nest.length; i++) {
        hash += nest.charCodeAt(i)
    }

    hash = Math.abs((hash << 2) ^ (hash + year))
    return hash % 6
}

async function findInStorage(nest: CrowNest, key: string, alreadyChecked: Set<NestName>, origin: NestName): Promise<string | undefined> {

    // local entry
    console.log('find in storage', nest.name, key, alreadyChecked)
    try {
        const entry = await nest.readStoragePromise(key)
        routeRequest(nest, {
            content: {
                key,
                entry,
                src: nest.name
            },
            src: nest.name,
            target: origin,
            type: 'storageResponse'
        }).catch(error => console.log('cannot deliver message', error))
        return entry
    } catch (error) {
        
    }

    console.log('find in remote storage', nest.name, key, nest.neighbors)

    alreadyChecked.add(nest.name)
    for (let neighbor of nest.connections.keys()) {
        if (alreadyChecked.has(neighbor)) {
            console.log('skip', neighbor)
            continue
        }
        alreadyChecked.add(neighbor)
        try {
            const entry = await routeRequest(nest, {
                content: {key, alreadyChecked, origin},
                src: nest.name,
                target: neighbor,
                type: 'storageQuery'
            })
            return entry
        } catch (error) {
            console.log('error routing storage query')
        }
    }

    throw `entry for key ${key} not found : ${nest.name}`
}

async function allChicks(nest: CrowNest, year: number) {
    const values = new Map<NestName, number>();

    const key = `chicks-${year}`
    const entry = await nest.readStoragePromise(key)
    values.set(nest.name, Number(entry))
    for (let connection of nest.connections.keys()) {
        const entry = await routeRequest(nest, {
            content: {key, alreadyChecked: new Set([nest.name]), origin: nest.name},
            src: nest.name,
            target: connection,
            type: 'storageQuery'
        })

        console.log('remote chick', connection, entry)
        values.set(connection, Number(entry))
    }

    console.log('chicks', key, values)
}

defineRequestTypeHandlerPromise('storageQuery', (dest: CrowNest, content: {content: {key: string, alreadyChecked: Set<NestName>, origin: NestName}, src: NestName}, src: NestName) => {
    
    console.log(dest.name, 'storage query for', content)
    const entryPromise = findInStorage(dest, content.content.key, content.content.alreadyChecked, content.content.origin)

    entryPromise.then((entry) => {

        console.log(dest.name, 'route response to', content.content.origin)
        routeRequest(dest, {
            content: {
                key: content.content.key,
                entry,
                src: dest.name
            },
            src: dest.name,
            target: content.content.origin,
            type: 'storageResponse'
        }).catch(error => console.log('cannot deliver message', error))
    })
    return entryPromise
})

defineRequestTypeHandlerPromise('storageResponse', (dest: CrowNest, content: {content: {key: string, entry: string, src: NestName}, src: NestName}, src: NestName) => {
    
    console.log(dest.name, 'received storage response', {key: content.content.key, entry: content.content.entry}, 'from', content.content.src)

    const [part1, part2] = content.content.key.split('-')

    if (part1 === 'chicks') {
        const year = Number(part2)

        let map = dest.chicksInfos.get(year)

        if (!map) 
        map = new Map()
        dest.chicksInfos.set(year, map)

        if (!content.content.src)
            debugger
        map.set(content.content.src, Number(content.content.entry))
        console.log('chicks info for year', year, dest.chicksInfos.get(year))
    }


})


findInStorage(crowNests.get('A') as CrowNest, 'treasure', new Set(['A']), 'A').catch(error => console.error(error))
findInStorage(crowNests.get('B') as CrowNest, 'treasure', new Set(['B']), 'B').catch(error => console.error(error))


setInterval(() => {
    console.log("storageInfos")
    const key = 'chicks-2014';
    if (false) for (let nest of crowNests.values()) {
        console.log(nest.name, key, nest.storage.get(key))
    } 

    false && findInStorage(crowNests.get('B') as CrowNest, 'treasure', new Set(['B']), 'B').catch(error => console.error(error))

    allChicks(crowNests.get('B') as CrowNest, 2014)
}, 1000);