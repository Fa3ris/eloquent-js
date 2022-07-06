import { performance } from 'perf_hooks';
console.log('crow network')

type CacheName = string;

type FoodCache = any;

type NestName = string;
type MessageType = 'note' | 'ping' | 'gossip' | 'connections' | 'route' | 'message' | 'ack'

type ResponseProducer = (dest: CrowNest, content: any, src: NestName) => any | Promise<any>

type MessageHandlingFinishedHandler = (error: any, value: any) => void

type MessageHandler = (dest: CrowNest, content: any, src: NestName, messageHandlingFinishedHandler: MessageHandlingFinishedHandler) => void


const messageHandlers = new Map<MessageType, MessageHandler>()
const crowNests = new Map<NestName, CrowNest>()



class CrowNest {

    name: NestName

    gossips: Set<any> = new Set()
    
    neighbors = new Set<NestName>()

    connections = new Map<NestName, {neighbors: Set<NestName>, date: number}>()

    constructor(name: NestName) {
        this.name = name
    }

    readStorageCallback(name: CacheName, callback: (cache: FoodCache) => void) {

        setTimeout(() => callback('toto'), 20)
    }

    readStoragePromise(name: CacheName): Promise<FoodCache> {
        return new Promise((resolve, reject) => {
            this.readStorageCallback(name, (cache) => resolve(cache))
        })
    }

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
 * @deprecated
 * @param type 
 * @param messageHandler 
 */
function defineRequestTypeHandlerCallback(type: MessageType, messageHandler: MessageHandler) {
    messageHandlers.set(type, messageHandler)
}

function defineRequestTypeHandlerPromise(type: MessageType, responseProducer: ResponseProducer) {
 
    const messageHandler : MessageHandler = (dest, content, src, messageHandlingFinishedHandler) => {
        false && console.log('handle message for', type)
        try {
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
setInterval(() => {

    ++msgCount
    deliverMessage(crowNests.get('A') as CrowNest, 'D', 'coucou D.' + msgCount)
    deliverMessage(crowNests.get('A') as CrowNest, 'B', 'coucou B.' + msgCount)
    deliverMessage(crowNests.get('A') as CrowNest, 'E', 'coucou E.' + msgCount)
    deliverMessage(crowNests.get('A') as CrowNest, 'F', 'coucou F.' + msgCount)
}, 1000)