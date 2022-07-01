"use strict";
// turn off info log level
const _savedLog = console.log;
console.log = () => { };
Object.freeze(console); // prevent further modif TypeError: Cannot add property fun, object is not extensible
function runRobot(state, robot, memory) {
    for (let turn = 0; /* no exit */; ++turn) {
        if (state.allParcelsDelivered) {
            console.log('finished deliver all parcels in', turn, 'turns');
            return turn;
        }
        const action = robot(state, memory);
        console.log('robot moved to direction', action.direction);
        state = state.move(action.direction);
        memory = action.memory;
    }
}
function randomPick(arr) {
    const index = Math.floor(Math.random() * arr.length);
    return arr[index];
}
function randomRobot(state) {
    const possibleDests = roadGraph.get(state.currentPlace);
    if (!possibleDests) {
        throw `no possible dest from current state ${state}`;
    }
    return {
        direction: randomPick(possibleDests),
        memory: undefined
    };
}
const roads = [
    "Alice's House-Bob's House", "Alice's House-Cabin",
    "Alice's House-Post Office", "Bob's House-Town Hall",
    "Daria's House-Ernie's House", "Daria's House-Town Hall",
    "Ernie's House-Grete's House", "Grete's House-Farm",
    "Grete's House-Shop", "Marketplace-Farm",
    "Marketplace-Post Office", "Marketplace-Shop",
    "Marketplace-Town Hall", "Shop-Town Hall"
];
function addEdge(graph, from, to) {
    let dests = graph.get(from);
    if (!dests) {
        dests = [];
        graph.set(from, dests);
    }
    dests.push(to);
}
function buildGraph(roads) {
    const graph = new Map();
    for (let [from, to] of roads.map(r => r.split("-"))) {
        addEdge(graph, from, to);
        addEdge(graph, to, from);
    }
    return graph;
}
const roadGraph = buildGraph(roads);
console.log("****** print graph *********");
for (let [key, val] of roadGraph.entries()) {
    console.log("start", key, "can join", val);
}
console.log("****** print graph *********\n\n\n\n\n");
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
    constructor(place, parcels) {
        this.place = place;
        this.parcels = parcels;
    }
    get allParcelsDelivered() {
        return this.parcels.length == 0;
    }
    get currentPlace() {
        return this.place;
    }
    /**
     * return new VillageState after moving to destination
     *
     * if parcels address === destination, they are removed from the list
     * @param destination
     */
    move(destination) {
        var _a;
        console.log('\n');
        if (!((_a = roadGraph.get(this.place)) === null || _a === void 0 ? void 0 : _a.includes(destination))) {
            console.error('cannot move from', this.place, 'to destination', destination);
            return this;
        }
        console.log('move to destination', destination);
        const remainingParcels = this.parcels.filter(parcel => {
            const notDelivered = parcel.address !== destination;
            if (!notDelivered) {
                console.log('deliver parcel', parcel, 'at destination', destination);
            }
            return notDelivered;
        }).map(parcel => {
            if (parcel.place != this.place) {
                return parcel;
            }
            const movedParcel = { place: destination, address: parcel.address };
            console.log('transport parcel to', movedParcel);
            return movedParcel;
        });
        console.log('\n');
        return new VillageState(destination, remainingParcels);
    }
    static random(parcelCount = 5) {
        const parcels = [];
        const places = Array.from(roadGraph.keys());
        for (let i = 0; i < parcelCount; i++) {
            let address = randomPick(places);
            let place;
            do {
                place = randomPick(places);
            } while (place == address); // different start and end
            parcels.push({ place, address });
        }
        return new VillageState("Post Office", parcels);
    }
}
// TESTING
{ // restrict scope
    const first = new VillageState("Post Office", [{ place: "Post Office", address: "Alice's House" }]);
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
    console.log('random', VillageState.random());
    console.log('random', VillageState.random(1e5)); // fail for 1e8 - no more heap space
}
const testSet = VillageState.random();
console.log("BEGIN RANDOM ROBOT \n");
const n = 1000;
const results = new Array(n);
for (let i = 0; i < n; ++i) {
    results[i] = runRobot(testSet, randomRobot, {});
}
const sum = results.reduce((prev, curr) => prev + curr, 0);
const avg = sum / n;
console.log("\n\nEND RANDOM ROBOT");
console.debug(results);
console.debug('sum', sum);
console.debug('\x1b[32m%s %s', 'average', avg);
// \x1B = ASCII escape character 
// \x1b[0m to reset color
console.debug('\x1b[36m%s\x1b[0m', 'I am cyan');
