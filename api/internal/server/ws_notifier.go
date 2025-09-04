package server

import (
	"log"
	"net/http"
	"sync"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true //TODO
	},
}

type WebSocketNotifier struct {
	conn *websocket.Conn
	hub  *Hub
	mu   sync.Mutex
}

type Message struct {
	Event EventType `json:"event"`
	Data  any       `json:"data"`
}

func NewWebSocketNotifier(hub *Hub, c *gin.Context) (*WebSocketNotifier, error) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return nil, err
	}

	notifier := &WebSocketNotifier{conn: conn, hub: hub, mu: sync.Mutex{}}
	hub.Register(notifier)

	return notifier, nil
}

func (w *WebSocketNotifier) Notify(event EventType, data any) error {
	w.mu.Lock()
	defer w.mu.Unlock()

	log.Printf("Sending message via ws...")
	message := Message{Event: event, Data: data}
	return w.conn.WriteJSON(message)
}

func (w *WebSocketNotifier) Close() error {
	w.hub.Unregister(w)
	return w.conn.Close()
}
