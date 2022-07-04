
function print() {
    console.log('city module')
}

exports.changePrint = () => {

    exports.print = () => {
        console.log('city module changed')
    }
}

exports.print = print;
