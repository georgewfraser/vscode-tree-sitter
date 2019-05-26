let {a, b} = object
let {a, b, ...c} = object
const {a, b: {c, d}} = object




function a ({b, c}, {d}) {}




[a, b] = array;
[a, b, ...c] = array;
[,, c,, d,] = array;




function a({b = true}, [c, d = false]) {}
function b({c} = {}) {}



