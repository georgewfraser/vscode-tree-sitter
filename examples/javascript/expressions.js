"A string with \"double\" and 'single' quotes";
'A string with "double" and \'single\' quotes';
'\\'
"\\"

'A string with new \
line';


`one line`;
`multi
  line`;

`multi
  ${2 + 2}
  hello
  ${1 + 1, 2 + 2}
  line`;

`$$$$`;
`$$$$${ 1 }`;

`(a|b)$`;

`$`;

`$${'$'}$$${'$'}$$$$`;

`\ `;

`The command \`git ${args.join(' ')}\` exited with an unexpected code: ${exitCode}. The caller should either handle this error, or expect that exit code.`

`\\`;

`//`;


f `hello`;


101;
3.14;
3.14e+1;
0x1ABCDEFabcdef;
0o7632157312;
0b1010101001;
1e+3;


theVar;
theVar2;
$_;


var a = b
  , c = d
  , e = f;


this;
null;
undefined;
true;
false;


/one\\/;
/one/g;
/one/i;
/one/gim;
/on\/e/gim;
/on[^/]afe/gim;
/[\]/]/;


  foo
    ? /* comment */bar
    : baz


var x = {};
var x = { a: "b" };
var x = { c: "d", "e": f, 1: 2 };
var x = {
  g: h
}

var x = {
  [methodName]() {
  }
}


x = {a, b, get};
y = {a,};


var x = {
  foo: true,

  add(a, b) {
    return a + b;
  },

  get bar() { return c; },

  set bar(a) { c = a; },

  *barGenerator() { yield c; },

  get() { return 1; }
};


var x = {
  finally() {},
  catch() {},
  get: function () {},
  set: function () {},
  static: true,
  async: true,
};


class Foo {
  static one(a) { return a; };
  two(b) { return b; }
  three(c) { return c; }
}

class Foo extends require('another-class') {
  constructor() {
    super()
  }

  bar() {
    super.a()
  }
}


class Foo {
  catch() {}
  finally() {}
}


class Foo {
	static foo = 2
}


@eval
class Foo {
	@foo.bar(baz) static foo() {

	}
}


[];
[ "item1" ];
[ "item1", ];
[ "item1", item2 ];
[ , item2 ];
[ item2 = 5 ];


[
  function() {},
  function(arg1, ...arg2) {
    arg2;
  },
  function stuff() {},
  function trailing(a,) {},
  function trailing(a,b,) {}
]


a => 1;
() => 2;
(d, e) => 3;
(f, g) => {
  return h;
};
(trailing,) => 4;
(h, trailing,) => 5;
(set, kv) => 2;


[
  function *() {},
  function *generateStuff(arg1, arg2) {
    yield;
    yield arg2;
  }
]


function a({b}, c = d, e = f) {
}


x.someProperty;
x[someVariable];
x["some-string"];


return returned.promise()
  .done( newDefer.resolve )
  .fail( newDefer.reject )


return this.map(function (a) {
  return a.b;
})

// a comment

.filter(function (c) {
  return c.d;
})



x.someMethod(arg1, "arg2");
var x = function(x, y) {

}(a, b);


new module.Klass(1, "two");
new Thing;


await asyncFunction();
await asyncPromise;


async function foo() {}

var x = {
  async bar() {
  }
}

class Foo {
  async bar() {}
}

async (a) => { return foo; };


i++;
i--;
i + j * 3 - j % 5;
2 ** i * 3;
2 * i ** 3;
+x;
-x;


i || j;
i && j;
!a && !b || !c && !d;


i >> j;
i >>> j;
i << j;
i & j;
i | j;
~i ^ ~j


x < y;
x <= y;
x == y;
x === y;
x != y;
x !== y;
x >= y;
x > y;


x = 0;
x.y = 0;
x["y"] = 0;
async = 0;


a = 1, b = 2;
c = {d: (3, 4 + 5, 6)};


condition ? case1 : case2;

x.y = some.condition ?
  some.case :
  some.other.case;

typeof x;
x instanceof String;


delete thing['prop'];
true ? delete thing.prop : null;


a = void b()


s |= 1;
t %= 2;
w ^= 3;
x += 4;
y.z *= 5;
async += 1;
a >>= 1;
b >>>= 1;
c <<= 1;


a <= b && c >= d;
a.b = c ? d : e;
a && b(c) && d;
a && new b(c) && d;
typeof a == b && c instanceof d


a = <div className='b' tabIndex={1} />;
b = <Foo.Bar>a <span>b</span> c</Foo.Bar>;
b = <Foo.Bar.Baz.Baz></Foo.Bar.Baz.Baz>;


a = <a b c={d}> e {f} g </a>
h = <i>{...j}</i>
b = <Text {...j} />
b = <Text {...j}></Text>




foo(...rest)


(foo - bar) / baz
if (foo - bar) /baz/;
(this.a() / this.b() - 1) / 2


⁠// Type definitions for Dexie v1.4.1
﻿// Project: https://github.com/dfahlander/Dexie.js
​// Definitions by: David Fahlander <http://github.com/dfahlander>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped


yield db.users.where('[endpoint+email]')


var a = <Foo></Foo>
b = <Foo.Bar></Foo.Bar>
c = <> <Foo /> </>
d = <Bar> <Foo /> </Bar>
e = <Foo bar/>
f = <Foo bar="string" baz={2} data-i8n="dialogs.welcome.heading" bam />
g = <Avatar userId={foo.creatorId} />
h = <input checked={this.state.selectedNewStreetType === 'new-street-default' || !this.state.selectedNewStreetType}> </input>
i = <Foo:Bar bar={}>{...children}</Foo:Bar>

