#!/usr/bin/env node

import defaultMember from "module-name";
import * as name from "module-name";
import { member } from "module-name";
import { member1 , member2 } from "module-name";
import { member1 , member2 as alias2 } from "module-name";
import defaultMember, { member1, member2 as alias2 } from "module-name";
import defaultMember, * as name from "module-name";
import "module-name";
import { member1 , member2 as alias2, } from "module-name";




export { name1, name2, name3, nameN };
export { variable1 as name1, variable2 as name2, nameN };
export let name1, name2, nameN;
export let name1 = value1, name2 = value2, name3, nameN;

export default expression;
export default function () { }
export default function name1() { }
export { name1 as default };

export * from 'foo';
export { name1, name2, nameN } from 'foo';
export { import1 as name1, import2 as name2, nameN } from 'foo';




@injectable()
export class Foo {
}




if (x)
  log(y);

if (a.b) {
  log(c);
  d;
}




if (x)
  y;
else if (a)
  b;

if (a) {
  c;
  d;
} else {
  e;
}




for (var a, b; c; d)
  e;

for (i = 0, init(); i < 10; i++)
  log(y);

for (;;) {
  z;
  continue;
}

for (var i = 0
  ; i < l
  ; i++) {
}




for (item in items)
  item();

for (var item in items || {})
  item();

for (const {thing} in things)
  thing();


for (a of b)
  process(a);

for (let {a, b} of items || [])
  process(a, b);




for await (const chunk of stream) {
  str += chunk;
}




while (a)
  b();




do {
  a;
} while (b)

do a; while (b)



return;
return 5;
return 1,2;
return async;
return a;




var x = 1;
var x, y = {}, z;




var x = {

  // This is a property
  aProperty: 1,

  /*
   * This is a method
   */
  aMethod: function() {}
};




// this is the beginning of the script.
// here we go.
var thing = {

  // this is a property.
  // its value is a function.
  key: function(x /* this is a parameter */) {
    // this is one statement
    one();
    // this is another statement
    two();
  }
};




/* a */
const a = 1;

/* b **/
const b = 1;

/* c ***/
const c = 1;

/* d

***/
const d = 1;




y // comment
  * z;



switch (x) {
  case 1:
  case 2:
    something();
    break;
  case "three":
    somethingElse();
    break;
  default:
    return 4;
}




throw new Error("uh oh");




throw f = 1, f;
throw g = 2, g



try { a; } catch (b) { c; }
try { d; } finally { e; }
try { f; } catch { g; } finally { h; }




if (true) { ; };;;




theLoop:
for (;;) {
  if (a) {
    break theLoop;
  } else {
    continue theLoop;
  }
}




debugger;
debugger




with (x) { i; }


console.log("HI")



