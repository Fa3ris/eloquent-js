"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const persistent_1 = require("persistent");
let a = persistent_1.PGroup.empty.add("a");
let ab = a.add("b");
let b = ab.delete("a");
console.log(b.has("b"));
// → true
console.log(a.has("b"));
// → false
console.log(b.has("a"));
// → false
