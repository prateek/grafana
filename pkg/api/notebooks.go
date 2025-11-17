package api

import (
	"net/http"

	"github.com/grafana/grafana/pkg/api/response"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/dashboards"
	"github.com/grafana/grafana/pkg/services/notebooks"
	"github.com/grafana/grafana/pkg/util"
	"github.com/grafana/grafana/pkg/web"
)

//
//
//
// Responses:
// 401: unauthorisedError
// 403: forbiddenError
// 500: internalServerError
func (hs *HTTPServer) GetNotebooks(c *contextmodel.ReqContext) response.Response {
	ctx, span := tracer.Start(c.Req.Context(), "api.GetNotebooks")
	defer span.End()
	c.Req = c.Req.WithContext(ctx)

	query := dashboards.GetDashboardsByPluginIDQuery{
		OrgID:    c.GetOrgID(),
		PluginID: notebooks.PluginID,
	}

	result, err := hs.DashboardService.GetDashboardsByPluginID(ctx, &query)
	if err != nil {
		return response.Error(http.StatusInternalServerError, "Failed to get notebooks", err)
	}

	return response.JSON(http.StatusOK, result)
}

//
//
//
// Responses:
// 200: dashboardResponse
// 401: unauthorisedError
// 403: forbiddenError
// 404: notFoundError
// 500: internalServerError
func (hs *HTTPServer) GetNotebook(c *contextmodel.ReqContext) response.Response {
	ctx, span := tracer.Start(c.Req.Context(), "api.GetNotebook")
	defer span.End()
	c.Req = c.Req.WithContext(ctx)

	uid := web.Params(c.Req)[":uid"]
	dash, rsp := hs.getDashboardHelper(ctx, c.GetOrgID(), 0, uid)
	if rsp != nil {
		return rsp
	}

	if dash.PluginID != notebooks.PluginID {
		return response.Error(http.StatusNotFound, "Notebook not found", nil)
	}

	return hs.GetDashboard(c)
}

//
//
//
// Responses:
// 200: postDashboardResponse
// 400: badRequestError
// 401: unauthorisedError
// 403: forbiddenError
// 404: notFoundError
// 412: preconditionFailedError
// 422: unprocessableEntityError
// 500: internalServerError
func (hs *HTTPServer) PostNotebook(c *contextmodel.ReqContext) response.Response {
	ctx, span := tracer.Start(c.Req.Context(), "api.PostNotebook")
	defer span.End()
	c.Req = c.Req.WithContext(ctx)

	cmd := dashboards.SaveDashboardCommand{}
	if err := web.Bind(c.Req, &cmd); err != nil {
		return response.Error(http.StatusBadRequest, "bad request data", err)
	}

	cmd.PluginID = notebooks.PluginID

	if cmd.IsFolder {
		return response.Error(http.StatusBadRequest, "Notebooks cannot be folders", nil)
	}

	return hs.postDashboard(c, cmd)
}

//
//
//
// Responses:
// 200: postDashboardResponse
// 400: badRequestError
// 401: unauthorisedError
// 403: forbiddenError
// 404: notFoundError
// 412: preconditionFailedError
// 422: unprocessableEntityError
// 500: internalServerError
func (hs *HTTPServer) PutNotebook(c *contextmodel.ReqContext) response.Response {
	ctx, span := tracer.Start(c.Req.Context(), "api.PutNotebook")
	defer span.End()
	c.Req = c.Req.WithContext(ctx)

	uid := web.Params(c.Req)[":uid"]

	dash, rsp := hs.getDashboardHelper(ctx, c.GetOrgID(), 0, uid)
	if rsp != nil {
		return rsp
	}

	if dash.PluginID != notebooks.PluginID {
		return response.Error(http.StatusNotFound, "Notebook not found", nil)
	}

	cmd := dashboards.SaveDashboardCommand{}
	if err := web.Bind(c.Req, &cmd); err != nil {
		return response.Error(http.StatusBadRequest, "bad request data", err)
	}

	cmd.PluginID = notebooks.PluginID

	if cmd.IsFolder {
		return response.Error(http.StatusBadRequest, "Notebooks cannot be folders", nil)
	}

	return hs.postDashboard(c, cmd)
}

//
//
//
// Responses:
// 200: deleteDashboardResponse
// 401: unauthorisedError
// 403: forbiddenError
// 404: notFoundError
// 500: internalServerError
func (hs *HTTPServer) DeleteNotebook(c *contextmodel.ReqContext) response.Response {
	ctx, span := tracer.Start(c.Req.Context(), "api.DeleteNotebook")
	defer span.End()
	c.Req = c.Req.WithContext(ctx)

	uid := web.Params(c.Req)[":uid"]

	dash, rsp := hs.getDashboardHelper(ctx, c.GetOrgID(), 0, uid)
	if rsp != nil {
		return rsp
	}

	if dash.PluginID != notebooks.PluginID {
		return response.Error(http.StatusNotFound, "Notebook not found", nil)
	}

	err := hs.LibraryElementService.DisconnectElementsFromDashboard(c.Req.Context(), dash.ID)
	if err != nil {
		hs.log.Error(
			"Failed to disconnect library elements",
			"notebook", dash.ID,
			"identity", c.GetID(),
			"error", err)
	}

	err = hs.DashboardService.DeleteDashboard(c.Req.Context(), dash.ID, dash.UID, c.GetOrgID())
	if err != nil {
		return dashboardErrResponse(err, "Failed to delete notebook")
	}

	if hs.Live != nil {
		err := hs.Live.GrafanaScope.Dashboards.DashboardDeleted(c.GetOrgID(), c.SignedInUser, dash.UID)
		if err != nil {
			hs.log.Error("Failed to broadcast delete info", "notebook", dash.UID, "error", err)
		}
	}

	return response.JSON(http.StatusOK, util.DynMap{
		"title":   dash.Title,
		"message": "Notebook " + dash.Title + " deleted",
		"uid":     dash.UID,
	})
}
