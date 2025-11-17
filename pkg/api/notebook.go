package api

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"

	"github.com/grafana/grafana/pkg/api/apierrors"
	"github.com/grafana/grafana/pkg/api/response"
	"github.com/grafana/grafana/pkg/components/simplejson"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/dashboards"
	"github.com/grafana/grafana/pkg/services/folder"
	"github.com/grafana/grafana/pkg/web"
)

const NotebookType = "notebook"

// swagger:route GET /api/notebooks/uid/{uid} notebooks getNotebookByUID
//
// Get notebook by uid.
//
// Will return the notebook given the notebook unique identifier (uid).
// Notebooks are dashboards with restrictions: one panel per row, default to markdown panels.
//
// Responses:
// 200: dashboardResponse
// 401: unauthorisedError
// 403: forbiddenError
// 404: notFoundError
func (hs *HTTPServer) GetNotebook(c *contextmodel.ReqContext) response.Response {
	ctx, span := tracer.Start(c.Req.Context(), "api.GetNotebook")
	defer span.End()
	c.Req = c.Req.WithContext(ctx)

	uid := web.Params(c.Req)[":uid"]
	dash, rsp := hs.getDashboardHelper(ctx, c.GetOrgID(), 0, uid)
	if rsp != nil {
		return rsp
	}

	// Verify this is a notebook (check for notebook type tag or custom field)
	if !hs.isNotebook(dash) {
		return response.Error(http.StatusNotFound, "Notebook not found", nil)
	}

	return hs.GetDashboard(c)
}

// swagger:route POST /api/notebooks/db notebooks postNotebook
//
// Create / Update notebook.
//
// Creates a new notebook or updates an existing notebook.
// Notebooks are dashboards with restrictions: one panel per row, default to markdown panels.
//
// Responses:
// 200: postDashboardResponse
// 400: badRequestError
// 401: unauthorisedError
// 403: forbiddenError
// 412: preconditionFailedError
func (hs *HTTPServer) PostNotebook(c *contextmodel.ReqContext) response.Response {
	ctx, span := tracer.Start(c.Req.Context(), "api.PostNotebook")
	defer span.End()
	c.Req = c.Req.WithContext(ctx)

	cmd := dashboards.SaveDashboardCommand{}
	if err := web.Bind(c.Req, &cmd); err != nil {
		return response.Error(http.StatusBadRequest, "bad request data", err)
	}

	// Ensure this is marked as a notebook
	if cmd.Dashboard == nil {
		return response.Error(http.StatusBadRequest, "dashboard data required", nil)
	}

	// Mark as notebook type
	cmd.Dashboard.Set("type", NotebookType)
	
	// Add notebook tag if not present
	tags := cmd.Dashboard.Get("tags").MustStringArray()
	if !contains(tags, NotebookType) {
		tags = append(tags, NotebookType)
		cmd.Dashboard.Set("tags", tags)
	}
	
	// Ensure notebook restrictions: one panel per row
	if err := hs.enforceNotebookRestrictions(cmd.Dashboard); err != nil {
		return response.Error(http.StatusBadRequest, "invalid notebook format", err)
	}

	// Use dashboard service to save
	return hs.PostDashboard(c)
}

// swagger:route DELETE /api/notebooks/uid/{uid} notebooks deleteNotebookByUID
//
// Delete notebook by uid.
//
// Responses:
// 200: deleteDashboardResponse
// 401: unauthorisedError
// 403: forbiddenError
// 404: notFoundError
func (hs *HTTPServer) DeleteNotebook(c *contextmodel.ReqContext) response.Response {
	ctx, span := tracer.Start(c.Req.Context(), "api.DeleteNotebook")
	defer span.End()
	c.Req = c.Req.WithContext(ctx)

	uid := web.Params(c.Req)[":uid"]
	dash, rsp := hs.getDashboardHelper(ctx, c.GetOrgID(), 0, uid)
	if rsp != nil {
		return rsp
	}

	// Verify this is a notebook
	if !hs.isNotebook(dash) {
		return response.Error(http.StatusNotFound, "Notebook not found", nil)
	}

	return hs.DeleteDashboardByUID(c)
}

// swagger:route GET /api/notebooks/search notebooks searchNotebooks
//
// Search notebooks.
//
// Returns a list of notebooks the user has access to.
//
// Responses:
// 200: searchDashboardsResponse
// 401: unauthorisedError
func (hs *HTTPServer) SearchNotebooks(c *contextmodel.ReqContext) response.Response {
	ctx, span := tracer.Start(c.Req.Context(), "api.SearchNotebooks")
	defer span.End()
	c.Req = c.Req.WithContext(ctx)

	query := dashboards.FindPersistedDashboardsQuery{
		OrgId:        c.OrgID,
		SignedInUser: c.SignedInUser,
		Tags:         []string{NotebookType}, // Filter by notebook tag
		Limit:        1000,
		Page:         1,
		Permission:   dashboards.PERMISSION_VIEW,
		Sort:         "name_sort",
	}

	// Parse query parameters
	if err := web.Bind(c.Req, &query); err != nil {
		return response.Error(http.StatusBadRequest, "bad request data", err)
	}

	// Ensure we filter by notebook tag
	if len(query.Tags) == 0 {
		query.Tags = []string{NotebookType}
	} else if !contains(query.Tags, NotebookType) {
		query.Tags = append(query.Tags, NotebookType)
	}

	results, err := hs.DashboardService.SearchDashboards(ctx, &query)
	if err != nil {
		return apierrors.ToDashboardErrorResponse(ctx, err)
	}

	return response.JSON(http.StatusOK, results)
}

// isNotebook checks if a dashboard is a notebook
func (hs *HTTPServer) isNotebook(dash *dashboards.Dashboard) bool {
	if dash == nil || dash.Data == nil {
		return false
	}

	// Check for notebook type tag
	dashType := dash.Data.Get("type").MustString()
	if dashType == NotebookType {
		return true
	}

	// Check for notebook tag
	tags := dash.GetTags()
	for _, tag := range tags {
		if tag == NotebookType {
			return true
		}
	}

	return false
}

// enforceNotebookRestrictions ensures notebook format: one panel per row
func (hs *HTTPServer) enforceNotebookRestrictions(dashboard *simplejson.Json) error {
	panels := dashboard.Get("panels").MustArray()
	rows := dashboard.Get("rows").MustArray()

	// If using rows layout, ensure one panel per row
	if len(rows) > 0 {
		for _, rowInterface := range rows {
			row, ok := rowInterface.(map[string]interface{})
			if !ok {
				continue
			}
			rowPanels, ok := row["panels"].([]interface{})
			if ok && len(rowPanels) > 1 {
				return errors.New("notebooks can only have one panel per row")
			}
		}
	}

	// If using grid layout, ensure panels are in separate rows
	// This is handled by the frontend editor, but we validate here too
	if len(panels) > 0 {
		// Grid layout validation would go here if needed
		// For now, we rely on frontend to enforce this
	}

	return nil
}

// contains checks if a string slice contains a value
func contains(slice []string, value string) bool {
	for _, v := range slice {
		if v == value {
			return true
		}
	}
	return false
}
