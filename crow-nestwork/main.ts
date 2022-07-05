import { PerformanceObserver, performance } from 'perf_hooks';
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
    
    neighbors = new Set<CrowNest>()

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

        const targetCrowNest = crowNests.get(dest)

        if (!targetCrowNest) {
            
            messageHandlingFinishedHandler(new Error('no handler found for message type ' + type), undefined)
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

            // need to get timeoutID before else it may be undefined when call clearTimeout()
            const timeoutID = setTimeout(() => {
                console.log({dest , type}, 'execute retry callback for attempt', n, done)
                if (done) {
                    console.log({dest , type}, 'exit retry callback for attempt', n, done)
                    return
                }
                if (n < 3) {
                    currentAttempt = n + 1
                    attempt(currentAttempt)
                }
                else {reject(new Error("attempt " + n + " timed out"))}
            }, 250);

            nest.send(dest, type, content, (failedReason, value) => {
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
            })

           
        }
        attempt(currentAttempt)
    })
}


crowNests.set('B', new CrowNest('B'))


defineRequestTypeHandlerPromise('ping', () => "pong")


const sender =  new CrowNest('A')

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
