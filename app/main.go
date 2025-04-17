package main

import (
	"encoding/json"
	"io"
	"net/http"
)

type Echo struct {
	Headers       http.Header `json:"headers"`
	Method        string      `json:"method"`
	Url           string      `json:"url"`
	Body          string      `json:"body"`
	Ip            string      `json:"ip"`
	ContentLength int64       `json:"contentLength"`
}

func main() {
	s := http.NewServeMux()
	s.HandleFunc("/", handleRequest)

	go func() {
		http.ListenAndServe(":8080", s)
	}()

	select{}
}

func handleRequest(w http.ResponseWriter, r *http.Request) {
	var (
		echo Echo
		body string
	)

	echo.Method = r.Method
	echo.Url = r.RequestURI
	echo.Headers = r.Header
	echo.ContentLength = r.ContentLength
	echo.Ip = r.RemoteAddr

	bodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Failed to read request body", http.StatusBadRequest)
		return
	}
	body = string(bodyBytes)
	echo.Body = body

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(echo)
}
