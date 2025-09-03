package server

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/tt-trichter/app/api/internal/database"
)

type RunDco struct {
	Duration float32 `json:"duration" binding:"required,gt=0"`
	Rate     float32 `json:"rate" binding:"required,gt=0"`
	Volume   float32 `json:"volume" binding:"required,gt=0"`
	UserID   string  `json:"userId"`
	Image    string  `json:"image"`
}

type RunData struct {
	Duration float32 `json:"duration"`
	Rate     float32 `json:"rate"`
	Volume   float32 `json:"volume"`
}

type RunDao struct {
	ID        string    `json:"id"`
	Data      RunDco    `json:"data"`
	Image     string    `json:"image"`
	CreatedAt time.Time `json:"createdAt"`
	User      *UserInfo `json:"user"`
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

	var response []RunDao
	for _, run := range runs {
		runWithUser := RunDao{
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

	runData, err := json.Marshal(RunData{
		Rate:     runDco.Rate,
		Volume:   runDco.Volume,
		Duration: runDco.Duration,
	})
	if err != nil {
		log.Printf("Error marshaling run data: %v", err)
		c.JSON(http.StatusInternalServerError, APIResponse{
			Success: false,
			Error:   "Internal server error",
		})
		return
	}

	var userId pgtype.Text
	if runDco.UserID != "" {
		userId = pgtype.Text{String: runDco.UserID, Valid: true}
	}

	log.Printf("runData: %s", runData)
	log.Printf("UserID: %s", runDco.UserID)
	savedRun, err := s.db.Queries().SaveRun(c.Request.Context(), database.SaveRunParams{
		UserID: userId,
		Data:   runData,
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
