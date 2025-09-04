package server

import (
	"fmt"
	"net/http"
	"os"
	"strconv"
	"time"

	_ "github.com/joho/godotenv/autoload"

	"github.com/tt-trichter/app/api/internal/database"
)

type Server struct {
	port int
	db   database.Service
	hub  *Hub
}

func NewServer() *http.Server {
	port, _ := strconv.Atoi(os.Getenv("REST_PORT"))
	NewServer := &Server{
		port: port,
		db:   database.NewService(),
		hub:  NewHub(),
	}
	go NewServer.hub.Run()

	server := &http.Server{
		Addr:         fmt.Sprintf(":%d", NewServer.port),
		Handler:      NewServer.RegisterRoutes(),
		IdleTimeout:  time.Minute,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
	}

	return server
}

func (s *Server) Notify(event EventType, data any) {
	s.hub.broadcast <- Message{
		Event: event,
		Data:  data,
	}
}
