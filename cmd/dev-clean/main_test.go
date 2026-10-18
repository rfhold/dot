package main

import "testing"

func TestHelpDoesNotScan(t *testing.T) {
	if err := run([]string{"--help"}); err != nil {
		t.Fatal(err)
	}
}
func TestCLIRejectsUnexpectedArguments(t *testing.T) {
	if run([]string{"--root", ""}) == nil {
		t.Fatal("empty root")
	}
	if run([]string{"unexpected"}) == nil {
		t.Fatal("unexpected argument")
	}
	if run(nil) == nil {
		t.Fatal("missing launcher root")
	}
}
