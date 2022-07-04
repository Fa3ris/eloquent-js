// turn off info log level
const _savedLog = console.log;
const noop = () => {}
console.log = noop
// console.debug = noop
Object.freeze(console); // prevent further modif TypeError: Cannot add property fun, object is not extensible

type Road = string;

type Place = string;

type RoadGraph = Map<Place, Place[]>

type Parcel = {
    place: Place,
    address: Place
}

type RobotMemory = any

type RobotAction = {
    direction: Place,
    memory: RobotMemory
}

type robotFn = (state: VillageState, memory: RobotMemory) => RobotAction;


function runRobot(state: VillageState, robot: robotFn, memory: RobotMemory): number {

    console.log('init state'.toUpperCase() )
    state.print()
    for (let turn = 0 ; /* no exit */ ; ++turn) {
        if (state.allParcelsDelivered) {
            console.log('finished deliver all parcels in', turn, 'turns')
            return turn
        }

        const action = robot(state, memory)
        console.log('robot moved to direction', action.direction)
        state = state.move(action.direction)
        console.log('state at turn ', turn, )
        state.print()
        console.log('\n')

        memory = action.memory
    }
}


function randomPick<T>(arr: T[]): T {

    const index = Math.floor(Math.random() * arr.length)
    return arr[index];
}

function randomRobot(state: VillageState): RobotAction {
    const possibleDests = roadGraph.get(state.currentPlace)
    if (!possibleDests) {
        throw `no possible dest from current state ${state}`
    }
  return {
    direction : randomPick(possibleDests),
    memory: undefined
  }
}

    // has duplicates because need to find a valid paths between places
    const mailRoute: Place[] = [
        "Alice's House", "Cabin", "Alice's House", "Bob's House",
        "Town Hall", "Daria's House", "Ernie's House",
        "Grete's House", "Shop", "Grete's House", "Farm",
        "Marketplace", "Post Office"
    ];

function predefinedRouteRobot(state: VillageState, memory: Place[]): RobotAction {
    if (memory.length == 0) {
        memory = mailRoute
    }
    return {
        direction: memory[0], 
        memory: memory.slice(1)
    }
}

function pathFindingRobot(state: VillageState, route: Route): RobotAction {
    console.debug('remaining parcels to deliver', state.remainingParcelCount)
    console.debug('current place', state.currentPlace)
    if (route.length === 0) { // init or no parcel pending
        const parcelToDeliver = state.nextParcel
        console.debug('need to deliver parcel', parcelToDeliver)
        if (state.currentPlace !== parcelToDeliver.place) { // go pickup parcel
            console.debug('go pickup parcel', parcelToDeliver)
            route = breadthFirstSearch(roadGraph, state.currentPlace, parcelToDeliver.place)
        } else { // go deliver parcel
            console.debug('go deliver parcel', parcelToDeliver)
            route = breadthFirstSearch(roadGraph, state.currentPlace, parcelToDeliver.address)
        }
    }
    console.debug('route followed by robot is', route, '\n\n')
    return {
        direction: route[0],
        memory: route.slice(1)
    }
}

function closestPathFindingRobot(state: VillageState, route: Route): RobotAction {
    /* 
        find closest parcel from current place 
    
        if multiple closest parcels, select a route to parcel to pickup at its place instead of deliver at its address,
         because we may not have the parcel yet
    */
   
    if (route.length == 0) {
        const remainings = state.remainingParcels
        const routesToPickup = []
        const routesToDeliver = []
        const possibleDeliverPlaces = new Set<Place>()
        const possiblePickupPlaces = new Set<Place>()

        for (let parcel of remainings) {
            if (state.currentPlace !== parcel.place) { // does not have parcel yet
                possiblePickupPlaces.add(parcel.place)
            } else {
                if (state.currentPlace !== parcel.address) { // can deliver parcel
                    possibleDeliverPlaces.add(parcel.address)
                }
            }
        }
        /* 
        no need to compute routes for all parcel, need only find possible pickup and deliver places 
        */

        for (let pickupPlace of possiblePickupPlaces.keys()) {
            routesToPickup.push(breadthFirstSearch(roadGraph, state.currentPlace, pickupPlace))

        }

        for (let deliverPlace of possibleDeliverPlaces.keys()) {
            routesToDeliver.push(breadthFirstSearch(roadGraph, state.currentPlace, deliverPlace))
        }

        // for (let parcel of remainings) {
          
        //     if (state.currentPlace !== parcel.place) { // go pickup parcel
        //         routesToPickup.push(breadthFirstSearch(roadGraph, state.currentPlace, parcel.place))
        //     } else {
        //         routesToDeliver.push(breadthFirstSearch(roadGraph, state.currentPlace, parcel.address))
        //     }
        // }

        let shortestRouteToPickupLength = Infinity
        let shortestRouteToPickupIndex = -1

        for (let i = 0; i < routesToPickup.length ; ++i) {
            if (routesToPickup[i].length < shortestRouteToPickupLength) {
                shortestRouteToPickupLength = routesToPickup[i].length
                shortestRouteToPickupIndex = i
            }
        }

        let shortestRouteToDeliverLength = Infinity
        let shortestRouteToDeliverIndex = -1

        for (let i = 0; i < routesToDeliver.length ; ++i) {
            if (routesToDeliver[i].length < shortestRouteToDeliverLength) {
                shortestRouteToDeliverLength = routesToDeliver[i].length
                shortestRouteToDeliverIndex = i
            }
        }

        if (shortestRouteToPickupLength < shortestRouteToDeliverLength) { // prefer pickup over delivering
            route = routesToPickup[shortestRouteToPickupIndex]
        } else {
            route = routesToDeliver[shortestRouteToDeliverIndex]
        }
    }
    return {
        direction: route[0],
        memory: route.slice(1)
    }
    
}

const roads: Road[] = [
    "Alice's House-Bob's House",   "Alice's House-Cabin",
    "Alice's House-Post Office",   "Bob's House-Town Hall",
    "Daria's House-Ernie's House", "Daria's House-Town Hall",
    "Ernie's House-Grete's House", "Grete's House-Farm",
    "Grete's House-Shop",          "Marketplace-Farm",
    "Marketplace-Post Office",     "Marketplace-Shop",
    "Marketplace-Town Hall",       "Shop-Town Hall"
  ];


function addEdge(graph: RoadGraph, from: Place, to: Place) {
    let dests = graph.get(from);
    if (!dests) {
        dests = []
        graph.set(from, dests)
    }
    dests.push(to);
}


function buildGraph(roads: Road[]): RoadGraph {
    const graph = new Map();
    for (let [from, to] of roads.map(r => r.split("-"))) {
        addEdge(graph, from, to)
        addEdge(graph, to, from)
    }

    return graph;
}

const roadGraph = buildGraph(roads);

console.log("****** print graph *********")
for (let [key, val] of roadGraph.entries()) {
    console.log("start", key, "can join", val)
}
console.log("****** print graph *********\n\n\n\n\n")
  /* 
    Very instructive

    If you’re thinking in terms of object-oriented programming,
    your first impulse might be to start defining objects for the various elements in the world:

    a class
    for the robot,
    one for a parcel,
    maybe one for places.

    These could then hold properties that describe their current state,
    such as the pile of parcels at a location,
    which we could change when updating the world.

    This is WRONG.

    At least, it usually is.
    The fact that something sounds like an object does NOT automatically mean 
    that it should be an object in your program.
    Reflexively writing classes for every concept in your application tends to 
    leave you with a collection of interconnected objects that each have their own internal, changing state.
    Such programs are often hard to understand and thus easy to break.

    I think because it is hard to remember which states must be in cohesion


    INSTEAD IN THIS PARTICULAR CASE

    compute new immutable state

  */

    class VillageState {
        private place: Place;
        private parcels: Parcel[];

        constructor(place: Place, parcels: Parcel[]) {
            this.place = place;
            this.parcels = parcels
        }

        get nextParcel(): Parcel {
            return Object.assign({}, this.parcels[0])
        }

        get remainingParcelCount() : number {
            return this.parcels.length
        }

        /**
         * returns a copy
         */
        get remainingParcels(): Parcel[] {
            return [...this.parcels]
        }

        get allParcelsDelivered(): boolean {
            return this.parcels.length == 0 
        }

        get currentPlace(): Place {
            return this.place
        }

        /**
         * return new VillageState after moving to destination
         * 
         * if parcels address === destination, they are removed from the list
         * @param destination 
         */
        move(destination: Place): VillageState {

            console.log('\n')
            
            if (!roadGraph.get(this.place)?.includes(destination)) {
                console.error('cannot move from', this.place, 'to destination', destination)
                return this;
            }

            console.log('move to destination', destination)
            const remainingParcels = this.parcels.filter(parcel => {
                const deliveredAtCurrentPlace = this.place === parcel.address /*
                 if when leave current place we are already at a place where a parcel can be delivered 
                 can happen if on init state, a parcel address is the current place
                */
                const deliveredAtNextPlace = parcel.address === destination
                const notDelivered = !deliveredAtCurrentPlace && !deliveredAtNextPlace
                if (!notDelivered) {
                    console.debug('deliver parcel', parcel, 'at destination', destination)
                }
                return notDelivered
            }).map(parcel => { 
                if (parcel.place != this.place) { return parcel; }
                const movedParcel = {place: destination, address: parcel.address};
                console.log('transport parcel to', movedParcel)
                return movedParcel
            })
            console.log('\n')

            return new VillageState(destination, remainingParcels);

        }

        static random(parcelCount = 5): VillageState {
            const parcels = [];
            const places = Array.from(roadGraph.keys())
            for (let i = 0; i < parcelCount; i++) {
              let address = randomPick(places);
              let place;
              do {
                place = randomPick(places);
              } while (place == address); // different start and end
              parcels.push({place, address});
            }
            return new VillageState("Post Office", parcels);
        }

        print() {
            console.log('village state', this)
        }
    }

    // TESTING
    { // restrict scope
        const first = new VillageState(
            "Post Office",
            [{place: "Post Office", address: "Alice's House"}]
        );
        const next = first.move("Alice's House");
        
        console.log('next state', next); // { place: "Alice's House", parcels: [] }
        console.log('first state', first); /*
        {
            place: 'Post Office',
            parcels: [ { place: 'Post Office', address: "Alice's House" } ]
        }
        */
    }

    if (false) {
        console.log('random', VillageState.random())
        console.log('random', VillageState.random(1e5)) // fail for 1e8 - no more heap space
    }

    let testSet = VillageState.random(400)

    /**
     * number of tests
     */
    const n = 1

    if (false) {
        console.log("****** print graph *********")
        for (let [key, val] of roadGraph.entries()) {
            console.log("start", key, "can join", val)
        }
        console.log("****** print graph *********\n\n\n\n\n")

        console.log("BEGIN RANDOM ROBOT\n")
        const results = new Array(n);
        for (let i = 0; i < n; ++i) {
            results[i] = runRobot(testSet, randomRobot, {});
        }
    
        const sum = results.reduce((prev, curr) => prev + curr, 0)
        const avg = sum / n;
    
        console.log("\n\nEND RANDOM ROBOT")
        console.log(results)
        console.log('sum', sum)
        console.debug('\x1b[32m%s\x1b[0m %s', 'random robot average', avg)
    }
   

    if (false) {
        console.log("****** print graph *********")
        for (let [key, val] of roadGraph.entries()) {
            console.log("start", key, "can join", val)
        }
        console.log("****** print graph *********\n\n\n\n\n")

        console.log("BEGIN ROUTE ROBOT\n")

        const results = new Array(n);
        for (let i = 0; i < n; ++i) {
            results[i] = runRobot(testSet, predefinedRouteRobot, []);
        }

        console.log("\n\nEND ROUTE ROBOT")
    
        const sum = results.reduce((prev, curr) => prev + curr, 0)
        const avg = sum / n;
        
        console.error('\x1b[32m%s\x1b[0m %s', 'predefined route robot average', avg)
    }


    // \x1B = ASCII escape character 
    // \x1b[0m to reset color
    console.log('\x1b[36m%s\x1b[0m', 'I am cyan');

    type Route = Place[]

    function breadthFirstSearch(graph: RoadGraph, from: Place, to: Place): Route {
        const visited: Set<Place> = new Set();
        const queue: {at : Place, route: Route}[] = []
        queue.push({at: from, route: []})
        visited.add(from);

        while (queue.length > 0) {

            const dequeued = queue.shift()
            if (!dequeued) {
                console.error("impossible")
                return []
            }
            const places = graph.get(dequeued.at)
            if (!places) {
                console.log("dead end at", dequeued.at)
                continue
            }

            for (let place of places) {
                if (visited.has(place)) {
                    console.log("place already visited", place)
                    continue
                }
                if (place === to) { // on a trouve un chemin
                    console.log('found route')
                    return dequeued.route.concat(place)
                }
                visited.add(place)

                const newSubPath = {at : place, route: dequeued.route.concat(place)}
                console.log('subpath', newSubPath)
                queue.push(newSubPath)
            }
        }
        console.error('impossible too')
        return []
    }

    console.log(breadthFirstSearch(roadGraph, "Post Office", "Shop"))

    if (false)  {

        const places = Array.from(roadGraph.keys())

        const routes : [Place, Place, Route][] = [] 
        for (let from of places) {
            for (let to of places) {
                if (from === to) {
                    continue
                }
                routes.push([from, to, breadthFirstSearch(roadGraph, from, to)])

            }
        }
        for (let route of routes) {
            console.log(route)
        }
        console.log(routes.length)
    }


    if (false)  {
        console.log("****** print graph *********")
        for (let [key, val] of roadGraph.entries()) {
            console.log("start", key, "can join", val)
        }
        console.log("****** print graph *********\n\n\n\n\n")

        console.log("BEGIN PATH FINDING ROBOT\n")

        const results = new Array(n);
        for (let i = 0; i < n; ++i) {
            results[i] = runRobot(testSet, pathFindingRobot, []);
        }

        console.log("\n\nEND PATH FINDING ROBOT")
    
        const sum = results.reduce((prev, curr) => prev + curr, 0)
        const avg = sum / n;
        
        console.error('\x1b[32m%s\x1b[0m %s', 'predefined path finding robot average', avg)
    }

    if (false) {
        console.log("****** print graph *********")
        for (let [key, val] of roadGraph.entries()) {
            console.log("start", key, "can join", val)
        }
        console.log("****** print graph *********\n\n\n\n\n")

        console.log("BEGIN CLOSEST PATH FINDING ROBOT\n")

        const results = new Array(n);
        for (let i = 0; i < n; ++i) {
            results[i] = runRobot(testSet, closestPathFindingRobot, []);
        }

        console.log("\n\nEND CLOSEST PATH FINDING ROBOT")
    
        const sum = results.reduce((prev, curr) => prev + curr, 0)
        const avg = sum / n;
        
        console.error('\x1b[32m%s\x1b[0m %s', 'predefined path finding robot average', avg)
    }

    function compareRobots(robot1: robotFn, memory1: RobotMemory, robot2: robotFn, memory2: RobotMemory) {

        const n = 10;

        const results1 = []
        const results2 = []
        for (let i = 0; i < n; i++) {
            const test = VillageState.random(5)
            results1[i] = runRobot(test, robot1, memory1);
            results2[i] = runRobot(test, robot2, memory2);
        }

        const avg1 = results1.reduce((prev, curr) => prev + curr, 0) / n
        const avg2 = results2.reduce((prev, curr) => prev + curr, 0) / n

        console.debug("avg1", avg1)
        console.debug("avg2", avg2)

        if (avg1 < avg2) {
            console.debug('robot 1 is better')
        } else {
            console.debug('robot 2 is better')
        }
    }

    const randomRobotConfig = [randomRobot, []]
    const routeRobotConfig = [predefinedRouteRobot, []]
    const pathFindingRobotConfig = [pathFindingRobot, []]
    const closestPathFindingRobotConfig = [closestPathFindingRobot, []]

    compareRobots(pathFindingRobot, [], closestPathFindingRobot, [])
