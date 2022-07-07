
    // constructor called as a function
    const add = Function('a', 'b', 'return a + b')
    console.log('add is a', typeof add) // add is a function
    
    // constructor called as constructor -> returns an object 
    const addObj = new Function('a', 'b', 'return a + b')
    console.log('addObj is a', typeof add) // addObj is a function

    
    console.log(add(1, 2)) // 3
    console.log(addObj(1, 2)) // 3

    const ten = Number('10')

    const tenObj = new Number('10')

    console.log('ten is a', typeof ten) // ten is a number
    console.log('tenObj is a', typeof tenObj) // tenObj is a object