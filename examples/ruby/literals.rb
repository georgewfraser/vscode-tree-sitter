:foo
:foo!
:foo?
:foo=
:@foo
:@foo_0123_bar
:@@foo
:$foo
:$0
:_bar
:åäö




:+
:-
:+@
:-@
:[]
:[]=
:&
:!
:`
:^
:|
:~
:/
:%
:*
:**
:==
:===
:=~
:>
:>=
:>>
:<
:<=
:<<
:<=>




:'foo bar'
:'#{'




:"foo bar"
:"#"




:"foo #{bar}"




%s/a/
%s\a\
%s#a#




%s{a{b}c}
%s<a<b>c>
%s(a(b)c)
%s[a[b]c]




$foo
$$
$!
$@
$&
$`
$'
$+
$~
$=
$/
$\
$,
$;
$.
$<
$>
$_
$0
$*
$$
$?
$:
$"
$0
$1
$2
$3
$4
$5
$6
$7
$8
$9
$0
$10
$stdin
$stdout
$stderr
$DEBUG
$FILENAME
$LOAD_PATH
$VERBOSE




1234




3.times




1_234




0d1_234
0D1_234




0xa_bcd_ef0_123_456_789




01234567
0o1234567




0B1_0




1.234_5e678_90
1E30
1.0e+6
1.0e-6




-2i
+2i
1+1i
1-10i
10+3i
12-34i




2/3r




true
false




nil




''
' '
'  '




'\''
'\\ \n'
'\x00\x01\x02'




'#{hello'




""
" "
"  "




"\""
"\\"
"\d"
"\#{foo}"




"#"




"#{foo}"
"#{':foo' unless bar}"




%q/a/
%q\a\
%q#a#




%q<a<b>c>
%q{a{b}c}
%q[a[b]c]
%q(a(b)c)




%/a/
%\a\
%#a#




%<a<b>c>
%{a{b}c}
%[a[b]c]
%(a(b)c)




%Q#a#
%Q/a/
%Q\a\




%Q<a<b>c>
%Q{a{b}c}
%Q[a[b]c]
%Q(a(b)c)




%q(a) "b" "c"
"d" "e"




flash[:notice] = "Pattern addition failed for '%s' in '%s'", %
                  [pattern, key]

foo("%s '%s' " %
  [a, b])




?a
??
?\n
?\\
?\377
?\u{41}
?\M-a
?\C-a
?\M-\C-a
?あ
foo(?/)




"abc#{
  %r(def(ghi#{
    `whoami`
  })klm)
}nop"





<<TEXT
heredoc \x01 content
TEXT

<<TEXT1
  TEXT1 ok if indented
TEXT1

<<TEXT_B
* heredoc content
TEXT_B

<<~TEXT
content
TEXT

if indentation_works?
  <<-sql
  heredoc content
  sql

  <<~EOF
    content
  EOF
end

<<'..end src/parser.c modeval..id7a99570e05'
heredoc content
..end src/parser.c modeval..id7a99570e05





<<-eos
  repositories
eos




<<HTML
<HTML>
  <HEAD></HEAD><BODY></BODY>
</HTML>
HTML

<<a
attr_accessor
a




def foo
  select(<<-SQL)
  .
  SQL
end




select(<<-SQL)
ab
SQL
  .join()


joins(<<~SQL).
   `foo`
SQL
where("a")




joins(<<~SQL).where(<<~SQL).
  `one`
SQL
  `two`
SQL
group("b")




<<TEXT
a
b #{[1, "c #{2} d", 3]} e
#{4} f #{foo.bar}
#{a if b}
#{foo(1, bar).baz}
g
TEXT

return




foo.new(
  select: <<-TEXT,
    heredoc content,
  TEXT
  conditions: <<-TEXT
    heredoc content
  TEXT
)
{
  select: <<-TEXT,
    heredoc content,
  TEXT
  conditions: <<-TEXT
    heredoc content
  TEXT
}

[
  <<-TEXT,
  a
  TEXT
  <<-TEXT
  b
  TEXT
]

foo[
  1,
  <<-TEXT
  hi
  TEXT
  ] = 3




foo(<<-STR.strip_heredoc.tr()
    content #{bar().foo}
  STR
)




puts <<-ONE.size, <<-TWO.size
first heredoc content
ONE
second heredoc content
TWO




-> {
  select(<<-SQL)
  .
  SQL
}




<<-ONE




`/usr/bin/env test blah blah`




`/usr/bin/env test blah \`blah\``




[]




[ foo, bar ]
[foo, *bar]
[foo, *@bar]
[foo, *$bar]
[foo, :bar => 1]




[1, 2].any? { |i| i > 1 }



[ foo, ]




%w()




%w/one two/




%w(word word)




%W(a #{b} c)




%i()




%i/one two/




%i(word word)




%I(a #{b} c)




%I{
  *
  /#{something}+
  ok
}




{}




{:name=>"foo"}




{ "a" => 1, "b" => 2 }
{ [] => 1 }
{ foo => 1 }




{
  alias: :foo,
  and: :foo,
  begin: :foo,
  break: :foo,
  case: :foo,
  class: :foo,
  def: :foo,
  defined: :foo,
  do: :foo,
  else: :foo,
  elsif: :foo,
  end: :foo,
  ensure: :foo,
  false: :foo,
  for: :foo,
  in: :foo,
  module: :foo,
  next: :foo,
  nil: :foo,
  not: :foo,
  or: :foo,
  redo: :foo,
  rescue: :foo,
  retry: :foo,
  return: :foo,
  self: :foo,
  super: :foo,
  then: :foo,
  true: :foo,
  undef: :foo,
  when: :foo,
  yield: :foo,
  if: :foo,
  unless: :foo,
  while: :foo,
  until: :foo
}




{ a: 1, b: 2, "c": 3 }
{a:1, b:2, "c":3 }




{ a: 1, }




{a: 1, **{b: 2}}




{
  :pusher => pusher,

  # Only warm caches if there are fewer than 10 tags and branches.
  :should_warm_caches_after => 10,
}




/^(foo|bar[^_])$/i




/word#{foo}word/
/word#word/
/#/




%r/a/
%r\a\
%r#a#





%r<a<b>c>
%r{a{b}c}
%r[a[b]c]
%r(a(b)c)
%r(#)




%r/a#{b}c/




%r(a#{b}c)




-> {}




-> { foo }




-> foo { 1 }
-> (foo) { 1 }
-> *foo { 1 }
-> foo: 1 { 2 }
-> foo, bar { 2 }




-> (a, b, c) {
  1
  2
}




-> (foo) do
  1
end




Cß
@äö
@@äö
:äö
äö



