

function Promise_all1<T>(promises: Promise<T>[]): Promise<T[]> {

    // ANTI-PATTERN, do not make executor function an async function
    return new Promise<T[]>(async (resolve, reject) => {

        // hack to not show node warning of unhandled rejection
        for (let promise of promises) {
            promise.catch((e) => { false && console.log('promise errored', e)})
        }
        const resolved: T[] = []
        for (let promise of promises) {
            try {
                const val = await promise
                false && console.log('val', val)
                resolved.push(val)
            } catch (e) {
                false && console.error('rejected', e)
                reject(e)
                return
            }
        }
        resolve(resolved)
    })
}


async function Promise_all2<T>(promises: Promise<T>[]): Promise<T[]> {

    const resolved: T[] = []
    // hack to not show node warning of unhandled rejection
    for (let promise of promises) {
        promise.catch((e) => { false && console.log('promise errored', e)})
    }
    for (let promise of promises) {
        try {
            const res = await promise
            false && console.log('res', res)
            resolved.push(res)
        } catch (e) {
            false && console.error('error', e)
            throw(e)
        }
    }
    return resolved
}


function Promise_all3<T>(promises: Promise<T>[]): Promise<T[]> {
    const promise = new Promise<T[]>((resolve, reject) => {
        if (!promises || promises.length == 0) {
            resolve([])
            return
        }
        const results: T[] = []
        let pending = promises.length
        for (let i = 0; i < promises.length; i++) {
            promises[i].then((val) => {
                results[i] = val

                pending--;
                if (pending == 0) {
                    resolve(results)
                }
            }


            ).catch(reject)
        }
    })

    return promise

}


function soon(val: any) {
    return new Promise(resolve => {
        setTimeout(() => resolve(val), Math.random() * 500);
    });
}

function soonReject(val: any) {
    return new Promise((resolve, reject) => {
        setTimeout(() => reject(val), Math.random() * 500);
    });
}

// Test code.
if (true) {
    true && Promise_all1!([]).then(array => {
    console.log('fn1', "This should be []:", array);
});

true && Promise_all1!([soon(1), soon(2), soon(3)]).then(array => {
    console.log('fn1',"This should be [1, 2, 3]:", array);
});

true && Promise_all1!([soon(1), Promise.reject("X"), soonReject('Y'), soon(3)])
    .then(array => {
        console.log('fn1',"We should not get here");
    })
    .catch(error => {
        if (error != "X") {
            console.log('fn1',"Unexpected failure:", error);
        }
    });

}

if (true) {
    // ---- V2
    true && Promise_all2!([]).then(array => {
        console.log('fn2',"This should be []:", array);
    });
    
    true && Promise_all2!([soon(1), soon(2), soon(3)]).then(array => {
        console.log('fn2',"This should be [1, 2, 3]:", array);
    });
    
    true && Promise_all2!([soon(1), Promise.reject("X"), soon(3)])
        .then(array => {
            console.log('fn2',"We should not get here");
        })
        .catch(error => {
            if (error != "X") {
                console.log('fn2',"Unexpected failure:", error);
            }
        });

    }


    if (true) {
        // ---- V3
        Promise_all3!([]).then(array => {
            console.log('fn3',"This should be []:", array);
        });
        
        Promise_all3!([soon(1), soon(2), soon(3)]).then(array => {
            console.log('fn3',"This should be [1, 2, 3]:", array);
        });
        
        Promise_all3!([soon(1), Promise.reject("X"), soon(3)])
            .then(array => {
                console.log('fn3',"We should not get here");
            })
            .catch(error => {
                if (error != "X") {
                    console.log('fn3',"Unexpected failure:", error);
                }
            });
    
        }