console.log('crow network')

type CacheName = string;

type FoodCache = any;

type Nest = string;
type MessageType = 'note'

type ResponseProducer = (dest: Nest, content: any, src: Nest) => any | Promise<any>

type MessageHandlingFinishedHandler = (error: any, value: any) => void

type MessageHandler = (dest: Nest, content: any, src: Nest, messageHandlingFinishedHandler: MessageHandlingFinishedHandler) => void


class CrowNest {

    name: string = 'a nest'
    
    neighbors = new Set<CrowNest>()

    readStorageCallback(name: CacheName, callback: (cache: FoodCache) => void) {

        setTimeout(() => callback('toto'), 20)
    }

    readStoragePromise(name: CacheName): Promise<FoodCache> {
        return new Promise((resolve, reject) => {
            this.readStorageCallback(name, (cache) => resolve(cache))
        })
    }

    send(dest: Nest, type: MessageType, content: any, messageHandlingFinishedHandler: MessageHandlingFinishedHandler) {


    }
}

function defineRequestTypeHandlerCallback(type: MessageType, callback: MessageHandler) {}

function defineRequestTypeHandlerPromise(type: MessageType, responseProducer: ResponseProducer) {
 
    const messageHandler : MessageHandler = (dest, content, src, messageHandlingFinishedHandler) => {
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


function sendRequest(nest: CrowNest, dest: Nest, type: MessageType, content: any): Promise<any> {
    return new Promise((resolve, reject) => {
        let done = false
        let currentAttempt = 1;
        function attempt(n: number): void {

            nest.send(dest, type, content, (failedReason, value) => {
                if (n !== currentAttempt) {
                    // response has arrived too late, ignore it
                    return
                }
                done = true
                if (failedReason) { reject(failedReason) } 
                else { resolve(value) }
            })

            setTimeout(() => {
                if (done) {return}
                if (n < 3) {
                    currentAttempt = n + 1
                    attempt(currentAttempt)
                }
                else {reject(new Error("attempt " + n + " timed out"))}
            }, 250);
        }
        attempt(currentAttempt)
    })
}