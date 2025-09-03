package server

import (
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
