package server

import (
	"log"
	"sync"
)

type EventType string

const (
	RunCreatedEvent EventType = "run-created"
	RunUpdatedEvent EventType = "run-updated"
	RunDeletedEvent EventType = "run-deleted"
)

type Notifier interface {
	Notify(event EventType, data any) error
	Close() error
}

type Hub struct {
	clients   map[*WebSocketNotifier]struct{}
	broadcast chan Message
	mu        sync.Mutex
}

func NewHub() *Hub {
	return &Hub{
		clients:   make(map[*WebSocketNotifier]struct{}),
		broadcast: make(chan Message),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case message := <-h.broadcast:
			log.Printf("Sending message to %d sockets...", len(h.clients))
			h.mu.Lock()
			for client := range h.clients {
				go client.Notify(message.Event, message.Data)
			}
			h.mu.Unlock()
		}
	}
}

func (h *Hub) Register(notifier *WebSocketNotifier) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.clients[notifier] = struct{}{}
}

func (h *Hub) Unregister(notifier *WebSocketNotifier) {
	h.mu.Lock()
	defer h.mu.Unlock()
	delete(h.clients, notifier)
}
