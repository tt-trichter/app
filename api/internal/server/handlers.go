package server

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/tt-trichter/app/api/internal/database"
)

type RunDco struct {
	Duration float64 `json:"duration" binding:"required,gt=0"`
	Rate     float64 `json:"rate" binding:"required,gt=0"`
	Volume   float64 `json:"volume" binding:"required,gt=0"`
	Image    string  `json:"image"`
}

type RunWithUser struct {
	ID     string  `json:"id"`
	UserID *string `json:"userId"`
	// TODO! RunDco includes image
	Data      RunDco    `json:"data"`
	Image     string    `json:"image"`
	CreatedAt time.Time `json:"createdAt"`
	User      *UserInfo `json:"user"`
}

type UserInfo struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Username string `json:"username"`
}

type APIResponse struct {
	Success bool        `json:"success"`
	Error   string      `json:"error,omitempty"`
	Details interface{} `json:"details,omitempty"`
}

func requireBasicAuth() gin.HandlerFunc {
	return gin.BasicAuth(gin.Accounts{
		os.Getenv("BASIC_AUTH_USERNAME"): os.Getenv("BASIC_AUTH_PASSWORD"),
	})
}

func (s *Server) getRunsWithUsersHandler(c *gin.Context) {
	runs, err := s.db.Queries().GetAllRunsWithUsers(c.Request.Context())
	if err != nil {
		log.Printf("Error getting runs with users: %v", err)
		c.JSON(http.StatusInternalServerError, APIResponse{
			Success: false,
			Error:   "Failed to fetch runs",
		})
		return
	}

	var response []RunWithUser
	for _, run := range runs {
		runWithUser := RunWithUser{
			ID:        run.ID.String(),
			Image:     run.Image,
			CreatedAt: run.CreatedAt.Time,
		}

		var runData RunDco
		if err := json.Unmarshal(run.Data, &runData); err != nil {
			log.Printf("Error unmarshaling run data: %v", err)
			continue
		}
		runWithUser.Data = runData

		if run.UserID.Valid {
			userID := run.UserID.String
			runWithUser.UserID = &userID
		}

		if run.UserName.Valid {
			runWithUser.User = &UserInfo{
				ID:       run.UserIDFull.String,
				Name:     run.UserName.String,
				Username: run.UserUsername.String,
			}
		}

		response = append(response, runWithUser)
	}

	c.JSON(http.StatusOK, response)
}

func (s *Server) createRunHandler(c *gin.Context) {
	user, password, hasAuth := c.Request.BasicAuth()
	if !hasAuth || user != os.Getenv("BASIC_AUTH_USERNAME") || password != os.Getenv("BASIC_AUTH_PASSWORD") {
		c.JSON(http.StatusUnauthorized, APIResponse{
			Success: false,
			Error:   "Unauthorized",
		})
		return
	}

	var runDco RunDco
	if err := c.ShouldBindJSON(&runDco); err != nil {
		c.JSON(http.StatusBadRequest, APIResponse{
			Success: false,
			Error:   "Validation failed",
			Details: err.Error(),
		})
		return
	}

	if runDco.Image == "" {
		runDco.Image = "trichter-images/placeholder.jpg"
	}

	runDataJSON, err := json.Marshal(runDco)
	if err != nil {
		log.Printf("Error marshaling run data: %v", err)
		c.JSON(http.StatusInternalServerError, APIResponse{
			Success: false,
			Error:   "Internal server error",
		})
		return
	}

	savedRun, err := s.db.Queries().SaveRun(c.Request.Context(), database.SaveRunParams{
		UserID: pgtype.Text{}, // No user ID for basic auth created runs
		Data:   runDataJSON,
		Image:  runDco.Image,
	})
	if err != nil {
		log.Printf("Error saving run: %v", err)
		c.JSON(http.StatusInternalServerError, APIResponse{
			Success: false,
			Error:   "Failed to save run",
		})
		return
	}

	log.Printf("Created new run: %s", savedRun.ID.String())

	// TODO: Emit SSE event for RunCreated

	c.JSON(http.StatusOK, APIResponse{Success: true})
}

func (s *Server) updateRunUserHandler(c *gin.Context) {
	runID := c.Param("id")

	var request struct {
		UserID string `json:"userId" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, APIResponse{
			Success: false,
			Error:   "Invalid request body",
			Details: err.Error(),
		})
		return
	}

	var runUUID pgtype.UUID
	if err := runUUID.Scan(runID); err != nil {
		c.JSON(http.StatusBadRequest, APIResponse{
			Success: false,
			Error:   "Invalid run ID format",
		})
		return
	}

	userIDText := pgtype.Text{String: request.UserID, Valid: true}

	_, err := s.db.Queries().UpdateRunWithUser(c.Request.Context(), database.UpdateRunWithUserParams{
		ID:     runUUID,
		UserID: userIDText,
	})
	if err != nil {
		log.Printf("Error updating run user: %v", err)
		c.JSON(http.StatusInternalServerError, APIResponse{
			Success: false,
			Error:   "Failed to update run",
		})
		return
	}

	log.Printf("Updated run %s with user %s", runID, request.UserID)

	// TODO: Emit SSE event for RunUpdated

	c.JSON(http.StatusOK, APIResponse{Success: true})
}

func (s *Server) deleteRunHandler(c *gin.Context) {
	runID := c.Param("id")

	// TODO: Implement proper auth check for admin role
	// For now, we'll skip the auth check as it requires JWT token validation

	var runUUID pgtype.UUID
	if err := runUUID.Scan(runID); err != nil {
		c.JSON(http.StatusBadRequest, APIResponse{
			Success: false,
			Error:   "Invalid run ID format",
		})
		return
	}

	err := s.db.Queries().DeleteRun(c.Request.Context(), runUUID)
	if err != nil {
		log.Printf("Error deleting run: %v", err)
		c.JSON(http.StatusInternalServerError, APIResponse{
			Success: false,
			Error:   "Failed to delete run",
		})
		return
	}

	log.Printf("Deleted run: %s", runID)

	// TODO: Emit SSE event for RunDeleted

	c.JSON(http.StatusOK, APIResponse{Success: true})
}

func (s *Server) runsSSEHandler(c *gin.Context) {
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("Access-Control-Allow-Origin", "*")

	// TODO: Implement proper SSE with event emitter
	// For now, just keep the connection open

	<-c.Request.Context().Done()
}

// Upload image handler
func (s *Server) uploadImageHandler(c *gin.Context) {
	// Check basic auth
	user, password, hasAuth := c.Request.BasicAuth()
	if !hasAuth || user != os.Getenv("BASIC_AUTH_USERNAME") || password != os.Getenv("BASIC_AUTH_PASSWORD") {
		c.JSON(http.StatusUnauthorized, APIResponse{
			Success: false,
			Error:   "Unauthorized",
		})
		return
	}

	// Check content type
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

func (s *Server) searchUsersHandler(c *gin.Context) {
	name := c.Query("name")
	limitStr := c.DefaultQuery("limit", "10")

	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, APIResponse{
			Success: false,
			Error:   "Invalid limit parameter",
		})
		return
	}

	users, err := s.db.Queries().SearchUsersByName(c.Request.Context(), database.SearchUsersByNameParams{
		Column1: pgtype.Text{String: name, Valid: true},
		Limit:   int32(limit),
	})
	if err != nil {
		log.Printf("Error searching users: %v", err)
		c.JSON(http.StatusInternalServerError, APIResponse{
			Success: false,
			Error:   "Failed to search users",
		})
		return
	}

	var response []map[string]interface{}
	for _, user := range users {
		response = append(response, map[string]interface{}{
			"id":              user.ID,
			"name":            user.Name,
			"username":        user.Username,
			"displayUsername": user.DisplayUsername,
		})
	}

	c.JSON(http.StatusOK, response)
}

func (s *Server) metricsHandler(c *gin.Context) {
	// TODO: Implement Prometheus metrics
	c.String(http.StatusOK, "# Placeholder metrics\n")
}

// Uploads handler (dev/local only)
func (s *Server) uploadsHandler(c *gin.Context) {
	filename := c.Param("filename")

	// Only serve files when STORAGE_PROVIDER=local
	if os.Getenv("STORAGE_PROVIDER") != "local" {
		c.JSON(http.StatusNotFound, APIResponse{
			Success: false,
			Error:   "Not found",
		})
		return
	}

	// TODO: Implement actual file serving
	c.JSON(http.StatusNotFound, APIResponse{
		Success: false,
		Error:   "File not found: " + filename,
	})
}
