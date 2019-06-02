package example

type Person struct {
	name string
	mom  *Person
}

func NewPerson(name string, mom *Person) Person {
	return Person{name: name, mom: mom}
}

func (self *Person) GetName() string {
	return self.name
}

func (self *Person) GetMom() *Person {
	return self.mom
}

var people = []Person{
	Person{name: "Pebbles", mom: "Wilma"},
	Person{name: "Wilma", mom: "Pearl"},
}

func main() {
	for p := range people {
		println(p)
	}
}
