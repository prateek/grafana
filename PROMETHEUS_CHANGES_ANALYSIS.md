# Prometheus Data Source Changes: Apache 2.0 (v7.5.17) vs AGPLv3 (v12.3.0)

## Executive Summary

This document provides a comprehensive code-level analysis of changes to Prometheus support in Grafana between the last Apache 2.0 licensed release (v7.5.17) and the latest AGPLv3 release (v12.3.0). The analysis focuses on the Prometheus data source implementation, query editor, and visualization-related code paths.

**Key Finding**: The Prometheus data source underwent a major architectural refactoring, moving from a monolithic plugin structure to a modular package-based architecture with a separate backend library (`promlib`). The frontend code was extracted into `packages/grafana-prometheus`, and the backend was refactored to use a shared library pattern.

---

## 1. Versions Analyzed

### APACHE_TAG: v7.5.17
- **Tag**: `v7.5.17`
- **Commit SHA**: `177175f28edf30b9b8d4ac924f19c47f37a003ab`
- **Root License**: Apache License 2.0
- **License Verification**: Confirmed via `git show v7.5.17:LICENSE`

### AGPL_TAG: v12.3.0
- **Tag**: `v12.3.0`
- **Commit SHA**: `79bf2c484bdb0cd7103f0e25d6bb0b81d2f46274`
- **Root License**: GNU Affero General Public License v3 (AGPLv3)
- **License Verification**: Confirmed via `git show v12.3.0:LICENSE`
- **Package License**: `packages/grafana-prometheus/LICENSE_AGPL` (AGPLv3)

### Build System & Framework Notes

**v7.5.17:**
- Frontend: AngularJS/React hybrid (legacy architecture)
- Backend: Direct Go implementation in `pkg/tsdb/prometheus/`
- Plugin structure: Monolithic datasource plugin

**v12.3.0:**
- Frontend: React with TypeScript, modular package architecture
- Backend: Refactored to use `pkg/promlib/` library (shared Prometheus backend library)
- Plugin structure: Backend datasource plugin (`"backend": true` in plugin.json)
- Package: `@grafana/prometheus` (version 12.3.0) as separate npm package

---

## 2. High-Level Feature Differences (Prometheus)

| Feature / Capability | Support in APACHE_TAG (v7.5.17) | Support in AGPL_TAG (v12.3.0) | Notes |
|---------------------|----------------------------------|-------------------------------|-------|
| **Query Editor Modes** | Code editor only | Code editor + Visual Query Builder | New in AGPL_TAG: `editorMode` field with `builder` and `code` options |
| **Native Histograms** | ❌ Not supported | ✅ Supported | New functions: `histogram_avg`, `histogram_count`, `histogram_sum`, `histogram_fraction`, `histogram_stddev`, `histogram_stdvar` |
| **Exemplars** | ✅ Basic support | ✅ Enhanced support | Improved error handling, availability checks, instant query restrictions |
| **Query Caching** | ❌ Not supported | ✅ Supported | `incrementalQuerying`, `incrementalQueryOverlapWindow`, `cacheLevel` options |
| **Azure Authentication** | ❌ Not supported | ✅ Supported | New Azure auth integration via `azureauth` package |
| **SigV4 Authentication** | ❌ Not supported | ✅ Supported | AWS SigV4 authentication support |
| **OAuth Pass-through** | ❌ Not supported | ✅ Supported | `oauthPassThru` option |
| **Prometheus Flavors** | Generic | Cortex, Mimir, Prometheus, Thanos | `prometheusType` and `prometheusVersion` configuration |
| **Recording Rules** | ✅ Supported | ✅ Enhanced | `disableRecordingRules`, `allowAsRecordingRulesTarget` options |
| **Rules API** | ❌ Not supported | ✅ Supported | New routes for `/rules` and `/config/v1/rules` endpoints |
| **Metrics Browser** | ❌ Not supported | ✅ Supported | Visual metrics browser with label/value selectors |
| **Query Patterns** | ❌ Not supported | ✅ Supported | Pre-built query patterns modal |
| **Scopes & Ad-hoc Filters** | ❌ Not supported | ✅ Supported | `scopes`, `adhocFilters`, `groupByKeys` in query model |
| **Multi-value Filter Operators** | ❌ Not supported | ✅ Supported | `multiValueFilterOperators: true` in plugin.json |
| **Series Endpoint** | ❌ Not supported | ✅ Supported | `seriesEndpoint`, `seriesLimit` options |
| **Backend Plugin Architecture** | ❌ Frontend-only | ✅ Backend plugin | Major architectural change: queries now processed on backend |
| **Monaco Editor** | ❌ CodeMirror | ✅ Monaco Editor | Query editor uses Monaco instead of CodeMirror |
| **Result Transformer** | `transform()` function | `transformV2()` function | New transformer with improved DataFrame handling |

---

## 3. Frontend Datasource + Query Editor Changes

### 3.1 Code Location Changes

**v7.5.17:**
- Frontend: `public/app/plugins/datasource/prometheus/`
- ~45 TypeScript/TSX files in the datasource directory
- Components: `PromQueryEditor`, `PromQueryField`, `PromExploreQueryEditor`, etc.

**v12.3.0:**
- Frontend: `packages/grafana-prometheus/src/`
- ~150+ TypeScript/TSX files in the package
- Main entry: `packages/grafana-prometheus/src/index.ts`
- Components: `PromQueryEditorByApp`, `PromQueryEditorSelector`, `PromQueryBuilder`, etc.

### 3.2 Query Model / Types

#### v7.5.17 Query Interface (`types.ts`)

```typescript
export interface PromQuery extends DataQuery {
  expr: string;
  format?: string;
  instant?: boolean;
  range?: boolean;
  exemplar?: boolean;
  hinting?: boolean;
  interval?: string;
  intervalFactor?: number;
  legendFormat?: string;
  valueWithRefId?: boolean;
  requestId?: string;
  showingGraph?: boolean;
  showingTable?: boolean;
}
```

#### v12.3.0 Query Interface (`types.ts` + `dataquery.ts`)

```typescript
export interface PromQuery extends GenPromQuery, DataQuery {
  utcOffsetSec?: number;
  valueWithRefId?: boolean;
  showingGraph?: boolean;
  showingTable?: boolean;
  hinting?: boolean;
  interval?: string;
  fromExploreMetrics?: boolean;
}

// From dataquery.ts (generated schema)
export interface Prometheus extends common.DataQuery {
  editorMode?: QueryEditorMode;  // NEW: 'builder' | 'code'
  exemplar?: boolean;
  expr: string;
  format?: PromQueryFormat;  // 'time_series' | 'table' | 'heatmap'
  instant?: boolean;
  intervalFactor?: number;  // DEPRECATED
  legendFormat?: string;
  range?: boolean;
  scopes?: Array<ScopeSpec & Pick<Scope['metadata'], 'name'>>;  // NEW
  adhocFilters?: ScopeSpecFilter[];  // NEW
  groupByKeys?: string[];  // NEW
}
```

**Key Changes:**
1. **New `editorMode` field**: Supports visual query builder vs code editor
2. **New `scopes` field**: For scope-based filtering (new in Grafana)
3. **New `adhocFilters` and `groupByKeys`**: Enhanced filtering capabilities
4. **`intervalFactor` deprecated**: Replaced by max data points in query options
5. **`format` type narrowed**: Explicit union type instead of string
6. **New `utcOffsetSec`**: Timezone offset support

### 3.3 Component Structure and Props

#### v7.5.17: `PromQueryEditor.tsx`
- Class component (`PureComponent`)
- Direct state management
- Single editor component for all contexts
- Uses `PromQueryField` (CodeMirror-based)

#### v12.3.0: `PromQueryEditorByApp.tsx`
- Functional component with `memo`
- App-specific routing:
  - `CoreApp.CloudAlerting` → `PromQueryEditorForAlerting`
  - Default → `PromQueryEditorSelector`
- `PromQueryEditorSelector` chooses between:
  - Visual Query Builder (`PromQueryBuilder`)
  - Code Editor (`PromQueryCodeEditor` with Monaco)

**New Components in v12.3.0:**
- `PromQueryBuilder`: Visual query builder UI
- `PromQueryBuilderContainer`: Container for builder state
- `MetricsBrowser`: Visual metrics/labels browser
- `MonacoQueryField`: Monaco-based code editor
- `QueryPatternsModal`: Pre-built query patterns
- `PromQueryEditorSelector`: Mode switcher

### 3.4 UI/UX Changes in Query Editor

**v7.5.17:**
- Single code editor interface
- Format selector (Time series, Table, Heatmap)
- Instant/Range toggles
- Exemplar toggle
- Legend format input
- Interval input with interval factor

**v12.3.0:**
- **Dual-mode editor**: Visual builder + code editor
- **Visual Query Builder features:**
  - Metric selector with autocomplete
  - Label filters with visual UI
  - Aggregation operations
  - Binary operations
  - Function selector
  - Query preview
  - Query explanation
- **Enhanced code editor:**
  - Monaco editor (better autocomplete, syntax highlighting)
  - Improved PromQL language support
  - Better error messages
- **Metrics Browser:**
  - Visual metric selection
  - Label/value browsing
  - Filtering and search
- **Query Patterns:**
  - Pre-built query templates
  - Common patterns modal

### 3.5 DOM / CSS Stability Notes

**Breaking Changes for Browser Extensions / Test Automation:**

1. **Component Structure:**
   - v7.5.17: Components use class names like `gf-form`, `gf-form-input`
   - v12.3.0: Uses Emotion CSS-in-JS, class names are hashed/obfuscated
   - **Impact**: CSS selectors based on class names will break

2. **Query Editor DOM:**
   - v7.5.17: `PromQueryField` renders CodeMirror in predictable structure
   - v12.3.0: `MonacoQueryField` renders Monaco editor (different DOM structure)
   - **Impact**: DOM traversal for query input will need updates

3. **Test IDs:**
   - v7.5.17: Limited `data-testid` attributes
   - v12.3.0: More `data-testid` attributes (e.g., `PromExemplarField` has `data-testid` prop)
   - **Recommendation**: Use `data-testid` instead of class names

4. **Component Hierarchy:**
   - v7.5.17: Flat component structure
   - v12.3.0: Nested component structure with `PromQueryEditorSelector` → `PromQueryBuilder` / `PromQueryCodeEditor`
   - **Impact**: Component location paths changed

**Migration Guidance:**
- Update selectors to use `data-testid` attributes where available
- Avoid relying on CSS class names (use data attributes or component structure)
- Account for dual editor modes (builder vs code) in automation

---

## 4. Backend / Query Engine Changes

### 4.1 Architecture Refactoring

#### v7.5.17 Backend (`pkg/tsdb/prometheus/prometheus.go`)

**Structure:**
- Direct implementation in `pkg/tsdb/prometheus/`
- `PrometheusExecutor` struct with `Query()` method
- Direct Prometheus client API usage (`github.com/prometheus/client_golang/api`)
- ~230 lines of Go code

**Key Functions:**
- `NewPrometheusExecutor()`: Creates executor
- `Query()`: Executes queries, returns `tsdb.Response`
- `parseQuery()`: Parses query model
- `parseResponse()`: Converts Prometheus response to Grafana format
- `formatLegend()`: Formats legend strings

#### v12.3.0 Backend (`pkg/tsdb/prometheus/prometheus.go`)

**Structure:**
- Thin wrapper around `pkg/promlib/` library
- `Service` struct that delegates to `promlib.Service`
- ~80 lines of Go code (mostly delegation)
- Uses Grafana Plugin SDK (`github.com/grafana/grafana-plugin-sdk-go/backend`)

**Key Functions:**
- `ProvideService()`: Creates service with dependency injection
- `QueryData()`: Delegates to `promlib.Service.QueryData()`
- `CallResource()`: Delegates to `promlib.Service.CallResource()`
- `GetBuildInfo()`: Gets Prometheus build info
- `GetHeuristics()`: Gets query heuristics
- `CheckHealth()`: Health check
- `extendClientOpts()`: Extends HTTP client with Azure/SigV4 auth

**New Capabilities:**
1. **Azure Authentication**: `pkg/tsdb/prometheus/azureauth/azure.go` (107 lines)
2. **SigV4 Support**: AWS authentication
3. **Resource API**: `CallResource()` for metrics/labels/series endpoints
4. **Build Info API**: Version and feature detection
5. **Heuristics API**: Query optimization hints
6. **Admission Webhooks**: `ValidateAdmission()`, `MutateAdmission()`
7. **Object Conversion**: `ConvertObjects()` for Kubernetes integration

### 4.2 Query Execution Changes

#### v7.5.17 Query Flow:
1. `Query()` receives `tsdb.TsdbQuery`
2. Parses query model to `PrometheusQuery`
3. Calls Prometheus API `QueryRange()`
4. Converts `model.Matrix` to `tsdb.TimeSeries`
5. Returns `tsdb.Response`

#### v12.3.0 Query Flow:
1. `QueryData()` receives `backend.QueryDataRequest`
2. Delegates to `promlib.Service.QueryData()`
3. `promlib` handles:
   - Query parsing and validation
   - HTTP client management
   - Response transformation to DataFrames
   - Caching (if enabled)
   - Error handling
4. Returns `backend.QueryDataResponse` with DataFrames

**Key Differences:**
- v7.5.17: Returns `tsdb.TimeSeries` (legacy format)
- v12.3.0: Returns `DataFrame` (modern Grafana data model)
- v12.3.0: Backend processing enables caching, incremental queries
- v12.3.0: Better error handling and validation

### 4.3 New Backend Endpoints

**v12.3.0 plugin.json routes:**
```json
{
  "routes": [
    { "method": "POST", "path": "api/v1/query" },
    { "method": "POST", "path": "api/v1/query_range" },
    { "method": "POST", "path": "api/v1/series" },
    { "method": "POST", "path": "api/v1/labels" },
    { "method": "POST", "path": "api/v1/query_exemplars" },
    { "method": "GET", "path": "/rules" },
    { "method": "POST", "path": "/rules" },
    { "method": "DELETE", "path": "/rules" },
    { "method": "DELETE", "path": "/config/v1/rules" },
    { "method": "POST", "path": "/config/v1/rules" }
  ]
}
```

**New Capabilities:**
- Rules management API (read/write/delete)
- Series endpoint for metadata queries
- Labels endpoint for autocomplete
- Exemplars endpoint for trace linking

### 4.4 Removed / Deprecated Functionality

**Removed in v12.3.0:**
- `types.go` file (types moved to `promlib`)
- Direct Prometheus client API usage
- `intervalFactor` calculation (replaced by max data points)

**Behavior Changes:**
- Error handling: v12.3.0 uses structured errors from Plugin SDK
- Response format: DataFrame instead of TimeSeries
- Query validation: More strict validation in `promlib`

---

## 5. Visualization & Data Model Changes

### 5.1 Result Transformation

#### v7.5.17: `result_transformer.ts`

**Function**: `transform(response, transformOptions)`

**Process:**
1. Converts Prometheus response to `ArrayDataFrame`
2. Handles exemplars separately
3. Formats legend using template variables
4. Returns single DataFrame per query

**Key Features:**
- Basic exemplar support
- Legend formatting with `{{label}}` syntax
- Time series and table formats
- Heatmap format (basic)

#### v12.3.0: `result_transformer.ts`

**Function**: `transformV2(response, request, options)`

**Process:**
1. Partitions DataFrames by type (table, exemplar, heatmap, time series)
2. Processes each type separately
3. Enriches exemplars with data links
4. Transforms heatmaps with histogram support
5. Handles native histograms

**Key Features:**
- **Enhanced exemplar handling**: Data links for trace integration
- **Native histogram support**: `transformToHistogramOverTime()` function
- **Better DataFrame metadata**: `resultType`, `dataTopic` fields
- **Improved table format**: Better handling of vector/scalar results
- **Heatmap improvements**: Cumulative histogram de-accumulation

### 5.2 DataFrame / Field Schemas

#### v7.5.17:
- Uses `ArrayDataFrame` with `ArrayVector`
- Fields: `time`, `value`, plus label fields
- Metadata: Basic `preferredVisualisationType`

#### v12.3.0:
- Uses standard `DataFrame` with typed arrays
- Fields: `TIME_SERIES_TIME_FIELD_NAME`, `TIME_SERIES_VALUE_FIELD_NAME`
- Enhanced metadata:
  - `meta.custom.resultType`: 'vector', 'matrix', 'scalar', 'exemplar'
  - `meta.dataTopic`: `DataTopic.Annotations` for exemplars
  - `meta.type`: `DataFrameType.HeatmapCells` for heatmaps
- Label handling: Improved label merging and display

### 5.3 Exemplar Handling

#### v7.5.17:
- Basic exemplar extraction from Prometheus response
- Simple time/value pairs
- No trace linking

#### v12.3.0:
- **Enhanced exemplar support:**
  - Availability checking (`datasource.exemplarsAvailable`)
  - Instant query restrictions (exemplars only for range queries)
  - Data links for trace ID destinations
  - Better error messages
- **Exemplar data links:**
  - Configurable trace ID destinations
  - URL templates with label substitution
  - Multiple destination support

### 5.4 Histogram Support

#### v7.5.17:
- Basic histogram support via `histogram_quantile()`
- Classic histograms only (with `_bucket` suffix)

#### v12.3.0:
- **Native histogram support:**
  - New functions: `histogram_avg`, `histogram_count`, `histogram_sum`, `histogram_fraction`, `histogram_stddev`, `histogram_stdvar`
  - Detection of native vs classic histograms
  - Special handling in metrics browser
- **Enhanced classic histogram support:**
  - Better `histogram_quantile()` handling
  - Improved heatmap transformation
  - De-accumulation for cumulative histograms

### 5.5 Panel Integration

**Changes affecting panel visualization:**

1. **DataFrame metadata:**
   - v12.3.0 adds `resultType` metadata for better panel selection
   - Panels can detect vector vs matrix results

2. **Heatmap panels:**
   - Native histogram support
   - Better cumulative histogram handling
   - Improved bucket boundary detection

3. **Table panels:**
   - Better handling of instant query results
   - Improved label display
   - Vector/scalar result formatting

4. **Time series panels:**
   - Enhanced legend formatting
   - Better label handling
   - Exemplar overlay improvements

---

## 6. Licensing Facts for Prometheus-Related Code

### 6.1 APACHE_TAG (v7.5.17)

**Root License:**
- File: `LICENSE` (root)
- License: Apache License 2.0

**Prometheus-Related Code:**
- `public/app/plugins/datasource/prometheus/`: Apache 2.0 (inherited from root)
- `pkg/tsdb/prometheus/`: Apache 2.0 (inherited from root)

**License Headers:**
- No per-file license headers found in Prometheus-related files
- All code inherits root Apache 2.0 license

### 6.2 AGPL_TAG (v12.3.0)

**Root License:**
- File: `LICENSE` (root)
- License: GNU Affero General Public License v3 (AGPLv3)

**Prometheus-Related Code:**

1. **Frontend Package:**
   - Location: `packages/grafana-prometheus/`
   - License File: `packages/grafana-prometheus/LICENSE_AGPL`
   - License: AGPLv3
   - Package.json: `"license": "AGPL-3.0-only"`

2. **Backend Code:**
   - Location: `pkg/tsdb/prometheus/`
   - License: AGPLv3 (inherited from root)
   - Location: `pkg/promlib/` (Prometheus backend library)
   - License: AGPLv3 (inherited from root)

3. **Plugin Wrapper:**
   - Location: `public/app/plugins/datasource/prometheus/`
   - License: AGPLv3 (inherited from root)
   - Note: This is now a thin wrapper that imports from `@grafana/prometheus` package

**License Headers:**
- `packages/grafana-prometheus/LICENSE_AGPL`: Full AGPLv3 text
- No per-file license headers found (inherits from root/package)

**Summary:**
- **v7.5.17**: All Prometheus-related code under Apache 2.0
- **v12.3.0**: All Prometheus-related code under AGPLv3
  - Frontend package has explicit `LICENSE_AGPL` file
  - Backend code inherits AGPLv3 from root
  - No code split to separate repositories with different licenses

---

## 7. Compatibility Notes & Migration Risks

### 7.1 Breaking Changes for Custom Integrations

#### Browser Extensions / DOM Manipulation

**Risk Level: HIGH**

1. **Query Editor DOM Structure:**
   - v7.5.17: CodeMirror editor with predictable class names
   - v12.3.0: Monaco editor with different DOM structure
   - **Impact**: Extensions injecting UI into query editor will break
   - **Mitigation**: Use `data-testid` attributes or component APIs

2. **CSS Class Names:**
   - v7.5.17: Stable class names (`gf-form`, `gf-form-input`)
   - v12.3.0: Emotion CSS-in-JS with hashed class names
   - **Impact**: CSS-based selectors will break
   - **Mitigation**: Use data attributes or component structure

3. **Component Hierarchy:**
   - v7.5.17: `PromQueryEditor` → `PromQueryField`
   - v12.3.0: `PromQueryEditorByApp` → `PromQueryEditorSelector` → `PromQueryBuilder` / `PromQueryCodeEditor`
   - **Impact**: Component location paths changed
   - **Mitigation**: Update component selectors

#### Query Builders / API Clients

**Risk Level: MEDIUM**

1. **Query Model Changes:**
   - New required/optional fields (`editorMode`, `scopes`, etc.)
   - Deprecated fields (`intervalFactor`)
   - **Impact**: Query JSON from v7.5.17 may need migration
   - **Mitigation**: Backward compatibility maintained, but new features require new fields

2. **Backend API Changes:**
   - v7.5.17: Frontend-only, direct Prometheus API calls
   - v12.3.0: Backend plugin, queries go through Grafana backend
   - **Impact**: Direct Prometheus API usage from frontend no longer possible
   - **Mitigation**: Use Grafana backend API or resource endpoints

3. **Response Format:**
   - v7.5.17: `tsdb.TimeSeries` format
   - v12.3.0: `DataFrame` format
   - **Impact**: Response parsing code will break
   - **Mitigation**: Use Grafana data processing utilities

#### Custom Dashboards with Persisted Queries

**Risk Level: LOW**

1. **Query JSON Compatibility:**
   - v7.5.17 queries are mostly compatible with v12.3.0
   - New fields are optional
   - Deprecated fields (`intervalFactor`) still work but are ignored
   - **Impact**: Minimal, queries should work with default settings
   - **Mitigation**: Queries auto-migrate on load

2. **Visual Query Builder:**
   - v7.5.17 queries created in code editor work in v12.3.0
   - v12.3.0 visual builder queries may not round-trip to v7.5.17
   - **Impact**: Low (v7.5.17 is old, migration expected)
   - **Mitigation**: Export queries as PromQL if needed

### 7.2 Migration Checklist

**For Browser Extensions:**
- [ ] Update DOM selectors to use `data-testid` attributes
- [ ] Account for dual editor modes (builder vs code)
- [ ] Update CSS selectors (avoid class names, use data attributes)
- [ ] Test with both Monaco editor and visual query builder
- [ ] Handle new component hierarchy

**For Custom Query Builders:**
- [ ] Update query model to include new optional fields
- [ ] Remove `intervalFactor` usage (use max data points instead)
- [ ] Add support for `editorMode` if building UI
- [ ] Update response parsing to handle DataFrame format
- [ ] Test with backend plugin architecture

**For Dashboard Migrations:**
- [ ] Verify queries work in v12.3.0 (should be automatic)
- [ ] Test exemplar functionality (may need reconfiguration)
- [ ] Update histogram queries to use native histogram functions if applicable
- [ ] Verify legend formatting still works
- [ ] Test with new visual query builder (optional)

**For Backend Integrations:**
- [ ] Update to use `promlib` if building custom Prometheus backend
- [ ] Add Azure/SigV4 auth support if needed
- [ ] Use new resource endpoints for metadata queries
- [ ] Update error handling for new error types

### 7.3 Feature-Specific Migration Notes

#### Exemplars
- **v7.5.17**: Basic exemplar toggle
- **v12.3.0**: Enhanced with availability checks and trace linking
- **Migration**: Reconfigure exemplar trace ID destinations if using trace linking

#### Histograms
- **v7.5.17**: Classic histograms only
- **v12.3.0**: Native + classic histograms
- **Migration**: Update queries to use native histogram functions if applicable

#### Query Caching
- **v7.5.17**: No caching
- **v12.3.0**: Incremental querying and caching
- **Migration**: Enable caching in datasource settings if desired

#### Authentication
- **v7.5.17**: Basic auth only
- **v12.3.0**: Azure, SigV4, OAuth support
- **Migration**: Configure new auth methods if needed

---

## 8. Code-Level Change Summary

### Files Added in v12.3.0

**Frontend:**
- `packages/grafana-prometheus/` (entire package, ~150 files)
- `packages/grafana-prometheus/src/querybuilder/` (80+ files for visual query builder)
- `packages/grafana-prometheus/src/components/monaco-query-field/` (16 files)
- `packages/grafana-prometheus/src/components/metrics-browser/` (12 files)

**Backend:**
- `pkg/promlib/` (entire library, shared Prometheus backend)
- `pkg/tsdb/prometheus/azureauth/azure.go` (Azure authentication)

### Files Removed in v12.3.0

**Frontend:**
- Most files from `public/app/plugins/datasource/prometheus/` (moved to package)
- `public/app/plugins/datasource/prometheus/datasource.ts` (replaced by package)
- `public/app/plugins/datasource/prometheus/components/PromQueryEditor.tsx` (replaced)
- `public/app/plugins/datasource/prometheus/components/PromQueryField.tsx` (replaced by Monaco)

**Backend:**
- `pkg/tsdb/prometheus/types.go` (moved to promlib)

### Files Modified

**Frontend:**
- `public/app/plugins/datasource/prometheus/module.ts` (now imports from package)
- `public/app/plugins/datasource/prometheus/plugin.json` (added routes, backend flag)

**Backend:**
- `pkg/tsdb/prometheus/prometheus.go` (complete rewrite, now thin wrapper)

### Key Architectural Changes

1. **Package Extraction**: Frontend code moved to `@grafana/prometheus` npm package
2. **Backend Library**: Backend logic extracted to `pkg/promlib/` shared library
3. **Plugin Architecture**: Changed from frontend-only to backend plugin
4. **Editor Framework**: CodeMirror → Monaco Editor
5. **Query Builder**: New visual query builder alongside code editor
6. **Data Model**: TimeSeries → DataFrame

---

## 9. Conclusion

The Prometheus data source in Grafana underwent a major architectural refactoring between v7.5.17 (Apache 2.0) and v12.3.0 (AGPLv3). The changes include:

1. **Modular Architecture**: Code extracted to separate packages/libraries
2. **Enhanced Features**: Native histograms, query builder, caching, enhanced auth
3. **Backend Processing**: Queries now processed on backend for better performance
4. **Improved UX**: Visual query builder, metrics browser, query patterns
5. **Better Integration**: Exemplar trace linking, rules API, resource endpoints

**For Integrators:**
- Browser extensions will need significant updates due to DOM/CSS changes
- Custom query builders should update to new query model
- Dashboard migrations should be mostly automatic
- Backend integrations should use new `promlib` library

**Licensing:**
- All Prometheus-related code moved from Apache 2.0 to AGPLv3
- No code split to separate repositories with different licenses
- Frontend package has explicit AGPLv3 license file

---

## Appendix: File Path Reference

### v7.5.17 Key Files
- Frontend Types: `public/app/plugins/datasource/prometheus/types.ts`
- Query Editor: `public/app/plugins/datasource/prometheus/components/PromQueryEditor.tsx`
- Result Transformer: `public/app/plugins/datasource/prometheus/result_transformer.ts`
- Backend: `pkg/tsdb/prometheus/prometheus.go`
- Backend Types: `pkg/tsdb/prometheus/types.go`

### v12.3.0 Key Files
- Frontend Package: `packages/grafana-prometheus/src/`
- Frontend Types: `packages/grafana-prometheus/src/types.ts`
- Query Model: `packages/grafana-prometheus/src/dataquery.ts`
- Query Editor: `packages/grafana-prometheus/src/components/PromQueryEditorByApp.tsx`
- Query Builder: `packages/grafana-prometheus/src/querybuilder/`
- Result Transformer: `packages/grafana-prometheus/src/result_transformer.ts`
- Backend: `pkg/tsdb/prometheus/prometheus.go`
- Backend Library: `pkg/promlib/`

---

**Report Generated**: Based on code analysis of tags v7.5.17 and v12.3.0
**Analysis Date**: 2024
**Methodology**: Git diff analysis, file inspection, code structure comparison
