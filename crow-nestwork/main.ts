console.log('crow network')

type CacheName = string;

type FoodCache = any;

type Nest = string;
type MessageType = 'note'

class CrowNest {


    readStorageCallback(name: CacheName, callback: (cache: FoodCache) => void) {

        setTimeout(() => callback('toto'), 20)
    }

    readStoragePromise(name: CacheName): Promise<FoodCache> {
        return new Promise((resolve, reject) => {
            this.readStorageCallback(name, (cache) => resolve(cache))
        })
    }

    send(dest: Nest, type: MessageType, content: any, callback: (failedReason: any, value: any) => void) {


    }
}

function defineRequestTypeHandlerCallback(type: MessageType, 
    callback: (dest: Nest, content: any, src: Nest, done: (failedReason: any, value: any) => void) => void) {}

function defineRequestTypeHandlerPromise(type: MessageType, handler: (dest: Nest, content: any, src: Nest) => any | Promise<any>) {
 
    defineRequestTypeHandlerCallback(type, 
        (dest: Nest, content: any, src: Nest, done: (failedReason: any, value: any) => void) => {

        let val
        try {
            val = handler(dest, content, src)
        } catch (error) {
            done(error, undefined)
            return
        }
        Promise.resolve(val).then(
            response => done(undefined, response),
            error => done(error, undefined) 
        )
    })
}


function sendRequest(nest: CrowNest, dest: Nest, type: MessageType, content: any): Promise<any> {
    return new Promise((resolve, reject) => {
        let done = false
        let currentAttempt = 1;
        function attempt(n: number): void {

            nest.send(dest, type, content, (failedReason, value) => {
                if (n !== currentAttempt) {
                    // response has arrived to late, ignore it
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