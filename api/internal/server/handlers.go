package server

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

type APIResponse struct {
	Success bool   `json:"success"`
	Error   string `json:"error,omitempty"`
	Details any    `json:"details,omitempty"`
}

func (s *Server) metricsHandler(c *gin.Context) {
	// TODO: Implement Prometheus metrics
	c.String(http.StatusOK, "# Placeholder metrics\n")
}

func (s *Server) wsHandler(c *gin.Context) {
	notifier, err := NewWebSocketNotifier(s.hub, c)
	if err != nil {
		log.Printf("WebSocket upgrade failed: %v", err)
	}
	defer notifier.Close()

	log.Printf("Received Connection!")
	<-c.Request.Context().Done()
}
