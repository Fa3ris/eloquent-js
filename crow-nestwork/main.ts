import { performance } from 'perf_hooks';
console.log('crow network')

type CacheName = string;

type FoodCache = any;

type NestName = string;
type MessageType = 'note' | 'ping' | 'gossip'

type ResponseProducer = (dest: CrowNest, content: any, src: NestName) => any | Promise<any>

type MessageHandlingFinishedHandler = (error: any, value: any) => void

type MessageHandler = (dest: CrowNest, content: any, src: NestName, messageHandlingFinishedHandler: MessageHandlingFinishedHandler) => void


const messageHandlers = new Map<MessageType, MessageHandler>()
const crowNests = new Map<NestName, CrowNest>()



class CrowNest {

    name: NestName

    gossips: Set<any> = new Set()
    
    neighbors = new Set<NestName>()

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
        console.log('found message handler for', type)
        messageHandler(targetCrowNest, content, this.name, (error, value) => {
            setTimeout(() => {
                messageHandlingFinishedHandler(error, value)
            }, 250 + (-250 + (Math.random() * 260)))
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
        console.log('handle message for', type)
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


sendGossip(crowNests.get('A') as CrowNest, "A is great").then(results => {
    console.log('flooding finished', results)

    for (let nest of crowNests.values()) {
        console.log(nest.name, Array.from(nest.gossips.values()))
    } 
    
}, err => {console.error('flooding failed', err)})
