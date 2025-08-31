package server

import (
	"net/http"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func (s *Server) RegisterRoutes() http.Handler {
	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://localhost:3000"}, // Add your frontend URLs
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		AllowHeaders:     []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true, // Enable cookies/auth
	}))

	// Health and basic routes
	r.GET("/", s.HelloWorldHandler)
	r.GET("/health", s.healthHandler)

	// Legacy route for backward compatibility
	r.GET("/runs", s.getRunsHandler)

	// Versioned API routes
	v1 := r.Group("/api/v1")
	{
		// Runs endpoints
		runs := v1.Group("/runs")
		{
			runs.GET("", s.getRunsWithUsersHandler)
			runs.POST("", s.createRunHandler)
			runs.POST("/sse", s.runsSSEHandler)
			runs.PUT("/:id/user", s.updateRunUserHandler)
			runs.DELETE("/:id", s.deleteRunHandler)
		}

		// Images endpoint
		v1.POST("/images", s.uploadImageHandler)

		// Users search endpoint
		v1.GET("/users/search", s.searchUsersHandler)
	}

	// Metrics endpoint
	r.GET("/metrics", s.metricsHandler)

	// Uploads endpoint (dev/local only)
	r.GET("/uploads/:filename", s.uploadsHandler)

	return r
}

func (s *Server) HelloWorldHandler(c *gin.Context) {
	resp := make(map[string]string)
	resp["message"] = "Hello World"

	c.JSON(http.StatusOK, resp)
}

func (s *Server) healthHandler(c *gin.Context) {
	c.JSON(http.StatusOK, s.db.Health())
}

func (s *Server) getRunsHandler(c *gin.Context) {
	runs, err := s.db.Queries().GetRuns(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, runs)
}
