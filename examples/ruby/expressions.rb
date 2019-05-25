Foo::bar
::Bar

puts ::Foo::Bar



foo[bar]
foo[*bar]
foo[* bar]
foo[]



foo["bar"]



foo[:bar]



foo[bar] = 1



()



;



yield



yield foo
yield foo, bar



not foo



foo and bar



foo or bar



a or b and c



defined? foo
defined? Foo.bar
defined?(foo)
defined?($foo)
defined?(@foo)
defined?(@äö)



x = y
x = *args
FALSE = "false"
TRUE = "true"
NIL = "nil"



x, y = [1, 2]
x, * = [1, 2]
x, *args = [1, 2]
x, y = *foo
self.foo, self.bar = target.a?, target.b
(x, y) = foo
(a, b, c = 1)



foo = 1, 2
x, y = foo, bar



a, (b, c), d, (e, (f, g)) = foo



x = foo a, b
x = foo a, :b => 1, :c => 2



x += y
x -= y
x *= y
x **= y
x /= y
puts "/hi"



x ||= y
x &&= y
x &= y
x |= y
x %= y
x >>= y
x <<= y
x ^= y



a ? b : c

a ? b
  : c



true ?")":"c"


foo ? true: false
foo ? return: false



a..b



a...b



a || b



a && b



a == b
a != b
a =~ b
a !~ b



a < b
a <= b
a > b
a >= b



a | b



a ^ b



a & b



a >> b
a << b



a + b



a * b



2+2*2



-a
foo -a, bar
foo(-a, bar)



foo-a
@ivar-1



a ** b



!a



foo
foo()
print "hello"
print("hello")



foo a,
  b, c



foo(a, b,)
foo(bar(a),)



foo.bar
foo.bar()
foo.bar "hi"
foo.bar "hi", 2
foo.bar("hi")
foo.bar("hi", 2)



foo[bar].()
foo.(1, 2)



a.() {}
a.(b: c) do
  d
end



foo.[]()



foo&.bar



foo(:a => true)
foo([] => 1)
foo(bar => 1)
foo :a => true, :c => 1



foo(a: true)
foo a: true
foo B: true



foo(if: true)
foo alias: true
foo and: true
foo begin: true
foo break: true
foo case: true
foo class: true
foo def: true
foo defined: true
foo do: true
foo else: true
foo elsif: true
foo end: true
foo ensure: true
foo false: true
foo for: true
foo if: true
foo in: true
foo module: true
foo next: true
foo nil: true
foo not: true
foo or: true
foo redo: true
foo rescue: true
foo retry: true
foo return: true
foo self: true
foo super: true
foo then: true
foo true: true
foo undef: true
foo unless: true
foo until: true
foo when: true
foo while: true
foo yield: true



foo (b), a



foo(&:sort)
foo(&bar)
foo(&bar, 1)
foo &bar
foo &bar, 1



foo(*bar)
foo *bar
foo *%w{ .. lib }
foo *(bar.baz)



foo :bar, -> (a) { 1 }
foo :bar, -> (a) { where(:c => b) }



foo :bar, -> (a) { 1 } do
end



foo(*bar)
foo(*[bar, baz].quoz)
foo(x, *bar)
foo(*bar.baz)
foo(**baz)



include D::E.f



Foo
  .bar
  .baz

Foo \
  .bar



foo do |i|
  foo
end

foo do
  |i| i
end

foo do; end

foo(a) do |i|
  foo
end

foo.bar a do |i|
  foo
end

foo(a) do |name: i, *args|
end



foo { |i| foo }
foo items.any? { |i| i > 0 }
foo(bar, baz) { quux }



foo { |; i, j| }



request.GET



-> (d, *f, (x, y)) {}

def foo(d, *f, (x, y))
end

def foo d, *f, (x, y)
end

foo do |a, (c, d, *f, (x, y)), *e|
end



foo []
foo [1]
foo[1]



lambda {}



lambda { foo }
lambda(&block) { foo }
lambda(&lambda{})



lambda { |foo| 1 }



lambda { |a, b, c|
  1
  2
}



lambda { |a, b,|
  1
}



lambda { |a, b=nil|
  1
}



lambda { |a, b: nil|
  1
}



lambda do |foo|
  1
end



proc = Proc.new
lambda = lambda {}
proc = proc {}



foo \
  a, b

"abc \
de"

foo \
  "abc"



10 / 5



h/w
"#{foo}"

Time.at(timestamp/1000)
"#{timestamp}"



foo /bar/



foo
/ bar/



Foo / "bar"
"/edit"



/ a
  b/


