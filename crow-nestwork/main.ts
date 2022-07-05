import { performance } from 'perf_hooks';
console.log('crow network')

type CacheName = string;

type FoodCache = any;

type NestName = string;
type MessageType = 'note' | 'ping'

type ResponseProducer = (dest: CrowNest, content: any, src: NestName) => any | Promise<any>

type MessageHandlingFinishedHandler = (error: any, value: any) => void

type MessageHandler = (dest: CrowNest, content: any, src: NestName, messageHandlingFinishedHandler: MessageHandlingFinishedHandler) => void


const messageHandlers = new Map<MessageType, MessageHandler>()
const crowNests = new Map<NestName, CrowNest>()



class CrowNest {

    name: NestName
    
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

        console.log('found message handler for', type)
        messageHandler(targetCrowNest, content, this.name, (error, value) => {
            messageHandlingFinishedHandler(error, value)
        });

    }
}

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
    defineRequestTypeHandlerCallback(type, messageHandler)
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

const nests: {[name: NestName]: CrowNest} = {
    'A' : sender,
    'B' : bNest,
    'C' : cNest,
    'D' : dNest
}

for (let name of ['A', 'B', 'C', 'D']) {
    crowNests.set(name, nests[name])
}

const connections = ['A-B', 'B-C', 'C-D']

for (let connection of connections) {
    const [nest1, nest2] = connection.split('-')
    nests[nest1].neighbors.add(nest2)
    nests[nest2].neighbors.add(nest1)
}


const t0 = performance.now()

if (true)
sendRequest(sender, 'B', 'ping', undefined).then(response => {
    console.log('ping - delay', performance.now() - t0)
    console.log('ping -', response)
},
    error => {console.error('ping -', error)})

if (true)
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

requestPingTargets(sender, ['B', 'C', 'D'])

requestPingTargets(bNest, ['A', 'C', 'D'])
requestPingTargets(cNest, ['A', 'B', 'D'])
requestPingTargets(dNest, ['A', 'B', 'C'])

// const pingTargets = ['B', 'C', 'D']
// const promises: Promise<any>[] = []
// for (let pingTarget of pingTargets) {
//     promises.push(sendRequest(sender, pingTarget, 'ping', undefined)
//         .then(() => true, () => false)
//     )
// }

// Promise.all(promises).then(results => {
//     console.log(results.map((value, i) => `${pingTargets[i]} ${value ? 'can be joined' : 'cannot be joined'} by ${sender.name}`
//     ))
// })

