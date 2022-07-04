"use strict";
exports.__esModule = true;
var fs_1 = require("fs");
try {
    // readdirSync('build')
    (0, fs_1.accessSync)('build');
    console.log('build dir already exists');
}
catch (e) {
    console.log('create build dir');
    (0, fs_1.mkdirSync)('build');
}
console.log((0, fs_1.readdirSync)('.'));
var tgzPattern = /.tgz$/;
var filenamesToCopy = [];
for (var _i = 0, _a = (0, fs_1.readdirSync)('.'); _i < _a.length; _i++) {
    var name_1 = _a[_i];
    if (tgzPattern.test(name_1)) {
        console.log("".concat(name_1, " matches"));
        filenamesToCopy.push(name_1);
    }
}
for (var _b = 0, filenamesToCopy_1 = filenamesToCopy; _b < filenamesToCopy_1.length; _b++) {
    var name_2 = filenamesToCopy_1[_b];
    console.log('copy', name_2, 'to', 'build/' + name_2);
    (0, fs_1.copyFileSync)(name_2, 'build/' + name_2);
    console.log(name_2, 'copied');
    console.log('delete', name_2);
    (0, fs_1.rmSync)(name_2);
    console.log(name_2, 'deleted');
}
