while foo do
end

while foo
end

while foo do
  bar
end

until foo do
end

until foo do
  bar
end

if foo
end

if foo then
else
end

if true then ;; 123; end


if foo then bar else quux end

if foo
  bar
elsif quux
  baz
end


if foo
  bar
elsif quux
  baz
else
  bat
end


unless foo
end

unless foo then
end

unless foo
else
end

for x in y do
	f
end

for x, y in z do
	f
end


for x in y
  f
end

for x in y
  next
end

for x in y
  retry
end

while b
  break
end

while b
  redo
end

begin
end

begin
	foo
end

begin
	foo
else
  bar
end


begin
	foo
ensure
  bar
end


begin
rescue
end

begin
rescue then
end

begin
rescue
  bar
end


begin
rescue x
end

begin
rescue x then
end

begin
rescue x
  bar
end

begin
rescue => x
  bar
end

begin
rescue x, y
  bar
end

begin
rescue Error => x
end

begin
rescue Error => x
  bar
end


begin
rescue *args
end

foo rescue nil

if foo rescue nil
elsif bar rescue nil
end

unless foo rescue nil
end


begin
	foo
rescue x
  retry
else
	quux
ensure
  baz
end


return foo

return

case foo
when bar
end


case foo
when bar
else
end

case key
when bar
else; leaf
end


case a
when b
  c
when d
  e
else
  f
end


case a
when *foo
  c
end


x = case foo
when bar
else
end


x = case foo = bar | baz
when bar
else
end

