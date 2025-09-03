package server

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

func (s *Server) uploadImageHandler(c *gin.Context) {
	contentType := c.GetHeader("Content-Type")
	if !strings.HasPrefix(contentType, "image/") {
		c.JSON(http.StatusUnsupportedMediaType, APIResponse{
			Success: false,
			Error:   "Unsupported media type",
		})
		return
	}

	// TODO: Implement actual image upload logic
	// For now, return placeholder path

	accept := c.GetHeader("Accept")
	path := fmt.Sprintf("trichter-images/uploaded-%d.jpg", time.Now().Unix())

	if strings.Contains(accept, "application/json") {
		c.JSON(http.StatusOK, map[string]string{"resource": path})
	} else {
		c.String(http.StatusOK, path)
	}
}
