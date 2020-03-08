package p

func f(a interface{}) {
	switch aa := a.(type) {
	case *int:
		print(aa)
	}
}
