# Class names must be capitalized.  Technically, it's a constant.
class Fred
  
  # The initialize method is the constructor.  The @val is
  # an object value.
  def initialize(v)
    @val = v
  end

  # Set it and get it.
  def set(v)
    @val = v
  end

  def get
    return @val
  end
end

# Objects are created by the new method of the class object.
a = Fred.new(10)
b = Fred.new(22)

print "A: ", a.get, " ", b.get,"\n";
b.set(34)
print "B: ", a.get, " ", b.get,"\n";

# Ruby classes are always unfinished works.  This does not
# re-define Fred, it adds more stuff to it.
class Fred 
  def inc
    @val += 1
  end
end

a.inc
b.inc
print "C: ", a.get, " ", b.get,"\n";

# Objects may have methods all to themselves.
def b.dec
  @val -= 1
end

begin
  b.dec
  a.dec
rescue StandardError => msg
  print "Error: ", msg, "\n"
end

print "D: ", a.get, " ", b.get,"\n";

x = :foo
y = :'bar'
z = :"doh"

require 'uri'

begin
  URI.open('https://google.com')
rescue URI::InvalidURIError => e
  puts "Error: #{e}"
end

Client.new('test')

Client::Subclient.method('test')

hash = {
  key1: 'value2',
  key2: 'value2'
}

hash2 = {
  :key1 => 'value1',
  :key2 => 'value2'
}

progress_bar = ProgressBar.create(
  total: 'test',
  format: "\e[0;32m%c/%C |%b>%i| %e\e[0m"
)

# def and end are the same color
def x_to_string
  x.to_s
end

# do should use the same color as end in this block of code
10.times do |i|
  puts i
end

class Human
  # A class variable. It is shared by all instances of this class.
  @@species = 'Homo sapiens'
end

$global = 'this is a global'

@var = "I'm an instance var"
defined? @var #=> "instance-variable"
defined @var