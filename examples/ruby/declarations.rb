def foo
end

def foo?
end

def foo!
end



def foo
  bar
end



def foo=
end



def `(a)
  "`"
end

def -@(a)
end

def %(a)
end

def ..(a)
end

def !~(a)
end



puts /(/

def /(name)
end

def / name
end




def foo
  super
end

def foo
  bar.baz { super }
end

def foo
  super.bar a, b
end



def foo(bar)
end

def foo(bar); end
def foo(bar) end



def foo bar
end



def foo(bar, quux)
end



def foo bar, quux
end



def foo(bar: nil, baz:)
end



def foo(bar = nil)
end

def foo(bar=nil)
end



def foo(*options)
end

def foo(x, *options)
end

def foo(x, *options, y)
end

def foo(**options)
end

def foo(name:, **)
end

def foo(&block)
end



def self.foo
end



def self.foo
  bar
end




def self.foo(bar)
end



def self.foo bar
end



def self.foo(bar, baz)
end




def self.foo bar, baz
end



class Foo
end

class Foo; end

class Foo::Bar
end

class ::Foo::Bar
end

class Cß
end



class Foo < Bar
end



class Foo < Bar::Quux
end

class Foo < ::Bar
end

class Foo < Bar::Baz.new(foo)
end



class Foo
	def bar
	end
end



class foo()::Bar
end



class << self
end

class <<self
end

class << Foo
end

class << Foo::Bar
end




module Foo
end

module Foo::Bar
end



module Foo
	def bar
	end
end



module Foo end



word
__END__
word
x
ab
d



module A
  class B < C
    include D::E.f.g

    attr_reader :h

    # i
    def j
      k
    end

    def self.l
    end
  end
end




BEGIN {

}



baz
BEGIN {
foo
}
bar



END {

}



baz
END {
foo
}
bar


