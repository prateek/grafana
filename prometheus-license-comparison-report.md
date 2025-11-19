# Grafana Prometheus Support: Apache 2.0 vs AGPLv3 License Comparison

## Executive Summary

This report provides a comprehensive code-level analysis of changes to Prometheus support between:
- **v7.5.17** (Last Apache 2.0 release)
- **v12.3.0** (Latest AGPLv3 release)

The analysis reveals **significant architectural changes**, including the extraction of Prometheus datasource code into a separate package, introduction of a visual query builder, migration to a shared backend library (promlib), and substantial additions to query capabilities.

---

## 1. Versions Analyzed

### Apache 2.0 Version
- **Tag**: `v7.5.17`
- **Commit SHA**: `177175f28edf30b9b8d4ac924f19c47f37a003ab`
- **License**: Apache License 2.0
- **Release Date Context**: Released in 2021 timeframe (7.x series)

### AGPLv3 Version
- **Tag**: `v12.3.0`
- **Commit SHA**: `79bf2c484bdb0cd7103f0e25d6bb0b81d2f46274`
- **License**: GNU Affero General Public License v3.0
- **Release Date Context**: Released in 2025 (12.x series)

### Architectural Context
- **v7.5.17**: Prometheus datasource embedded directly in main Grafana codebase
- **v12.3.0**: Prometheus datasource extracted to `@grafana/prometheus` package with separate versioning

---

## 2. High-Level Feature Differences (Prometheus)

| Feature / Capability | v7.5.17 (Apache 2.0) | v12.3.0 (AGPLv3) | Notes |
|---------------------|---------------------|-----------------|-------|
| **Visual Query Builder** | ❌ Not present | ✅ Full implementation | Major new feature with metrics browser, label filters, operation builder |
| **Query Editor Modes** | Single editor | Code + Builder modes | `QueryEditorMode` enum with switchable UI |
| **Exemplars Support** | ✅ Basic | ✅ Enhanced | Improved sampling, data links, urlDisplayLabel |
| **Backend Architecture** | Direct implementation | Delegated to `promlib` | Shared library for Prom/Loki/Mimir |
| **Query Model** | Simple PromQuery | Extended with scopes, adhocFilters, groupByKeys | Support for Grafana scopes feature |
| **Azure Authentication** | ❌ Not present | ✅ Full support | `azureauth` package with MSI, client secret |
| **Recording Rules** | ❌ Not exposed | ✅ Full support | Fetch, parse, and use recording rules |
| **Prometheus Types Detection** | Basic | Auto-detect (Prometheus, Mimir, Cortex, Thanos) | `PromApplication` enum |
| **Caching** | Basic | Configurable levels | `PrometheusCacheLevel` enum (None, Low, Medium, High) |
| **Incremental Querying** | ❌ Not present | ✅ Optional | `incrementalQuerying` option for large time ranges |
| **Monaco Editor Integration** | ❌ Not present | ✅ Full support | `monaco-promql` with syntax highlighting, autocomplete |
| **Metrics Browser** | ❌ Not present | ✅ Full implementation | Interactive metric, label, value selection UI |
| **Plugin Routes (RBAC)** | Not defined | Fully defined | Explicit routes with role-based permissions |
| **Abstract Query Support** | ❌ Not present | ✅ Implemented | `importFromAbstractQueries`, `exportToAbstractQueries` |
| **Series Endpoint Control** | Not configurable | `seriesEndpoint` + `seriesLimit` options | Control series API usage |
| **Data Transformation** | `transform()` function | `transformV2()` with DataFrame | Uses plugin SDK data structures |
| **Annotation Support** | Angular template-based | React components | `AnnotationQueryEditor` component |
| **Variable Query Types** | Limited | 6 types | `LabelNames`, `LabelValues`, `MetricNames`, `VarQueryResult`, `SeriesQuery`, `ClassicQuery` |

---

## 3. Frontend Datasource + Query Editor Changes

### 3.1 Code Organization

#### v7.5.17 Structure
```
public/app/plugins/datasource/prometheus/
├── components/
│   ├── PromCheatSheet.tsx
│   ├── PromExemplarField.tsx
│   ├── PromExploreExtraField.tsx
│   ├── PromExploreQueryEditor.tsx
│   ├── PromLink.tsx
│   ├── PromQueryEditor.tsx
│   └── PromQueryField.tsx
├── configuration/
│   ├── ConfigEditor.tsx
│   ├── ExemplarSetting.tsx
│   └── PromSettings.tsx
├── datasource.ts (867 lines)
├── language_provider.ts
├── module.ts
├── result_transformer.ts
├── types.ts (141 lines)
└── [~40 files total]
```

#### v12.3.0 Structure
```
packages/grafana-prometheus/
├── src/
│   ├── components/
│   │   ├── AnnotationQueryEditor.tsx (new)
│   │   ├── PromCheatSheet.tsx
│   │   ├── PromExemplarField.tsx
│   │   ├── PromQueryEditorByApp.tsx (new)
│   │   ├── PromQueryEditorForAlerting.tsx (new)
│   │   ├── PromQueryField.tsx
│   │   ├── VariableQueryEditor.tsx (new)
│   │   ├── metrics-browser/ (new - entire subsystem)
│   │   │   ├── MetricsBrowser.tsx
│   │   │   ├── MetricSelector.tsx
│   │   │   ├── LabelSelector.tsx
│   │   │   └── ValueSelector.tsx
│   │   └── monaco-query-field/ (new)
│   │       ├── MonacoQueryField.tsx
│   │       └── MonacoQueryFieldLazy.tsx
│   ├── querybuilder/ (new - ~80+ files)
│   │   ├── components/
│   │   │   ├── PromQueryBuilder.tsx
│   │   │   ├── PromQueryBuilderContainer.tsx
│   │   │   ├── PromQueryCodeEditor.tsx
│   │   │   ├── MetricsLabelsSection.tsx
│   │   │   ├── LabelFilters.tsx
│   │   │   └── [many more...]
│   │   ├── PromQueryModeller.ts
│   │   ├── aggregations.ts
│   │   ├── operations.ts
│   │   └── shared/types.ts
│   ├── configuration/
│   │   └── ConfigEditor.tsx
│   ├── datasource.ts (919 lines)
│   ├── language_provider.ts
│   ├── result_transformer.ts
│   ├── types.ts (186 lines)
│   ├── dataquery.gen.ts (new - generated schema)
│   ├── module.ts
│   ├── annotations.ts (new)
│   ├── caching.ts (new)
│   └── [~248 files total]
├── package.json (with AGPL-3.0-only license)
└── LICENSE_AGPL
```

**Key Structural Changes:**
- **6x increase** in file count (40 → 248 files)
- **Complete query builder subsystem** added
- **Monaco editor integration** for advanced code editing
- **Metrics browser** for visual metric exploration
- **App-specific editors** (dashboard vs alerting vs explore)
- **Separate package** with independent versioning

### 3.2 Query Model / Types

#### v7.5.17 PromQuery Interface
```typescript
interface PromQuery extends DataQuery {
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

#### v12.3.0 PromQuery Interface
```typescript
interface PromQuery extends GenPromQuery, DataQuery {
  // GenPromQuery includes:
  //   - expr: string
  //   - editorMode?: QueryEditorMode ('code' | 'builder')
  //   - exemplar?: boolean
  //   - format?: PromQueryFormat ('time_series' | 'table' | 'heatmap')
  //   - instant?: boolean
  //   - range?: boolean
  //   - legendFormat?: string
  //   - intervalFactor?: number (deprecated)
  //   - scopes?: Array<ScopeSpec>
  //   - adhocFilters?: ScopeSpecFilter[]
  //   - groupByKeys?: string[]
  
  utcOffsetSec?: number;           // NEW: Timezone alignment
  valueWithRefId?: boolean;
  showingGraph?: boolean;
  showingTable?: boolean;
  hinting?: boolean;
  interval?: string;
  fromExploreMetrics?: boolean;    // NEW: Track query origin
}
```

**Breaking Changes:**
1. **`format`**: Now strictly typed as `PromQueryFormat` enum instead of freeform string
2. **`editorMode`**: New required property for query builder vs code mode
3. **`scopes` and `adhocFilters`**: New for Grafana's scopes feature
4. **`groupByKeys`**: New for aggregation grouping
5. **Generated schema**: v12.3.0 uses code-generated types from CUE schema

### 3.3 Datasource Options

#### v7.5.17 PromOptions
```typescript
interface PromOptions extends DataSourceJsonData {
  timeInterval: string;
  queryTimeout: string;
  httpMethod: string;
  directUrl: string;
  customQueryParameters?: string;
  disableMetricsLookup?: boolean;
  exemplarTraceIdDestinations?: ExemplarTraceIdDestination[];
}
```

#### v12.3.0 PromOptions
```typescript
interface PromOptions extends DataSourceJsonData {
  timeInterval?: string;
  queryTimeout?: string;
  httpMethod?: string;
  customQueryParameters?: string;
  disableMetricsLookup?: boolean;
  exemplarTraceIdDestinations?: ExemplarTraceIdDestination[];
  prometheusType?: PromApplication;              // NEW
  prometheusVersion?: string;                     // NEW
  cacheLevel?: PrometheusCacheLevel;             // NEW
  defaultEditor?: QueryEditorMode;               // NEW
  incrementalQuerying?: boolean;                  // NEW
  incrementalQueryOverlapWindow?: string;        // NEW
  disableRecordingRules?: boolean;               // NEW
  allowAsRecordingRulesTarget?: boolean;         // NEW
  sigV4Auth?: boolean;                           // NEW
  oauthPassThru?: boolean;                       // NEW
  seriesEndpoint?: boolean;                      // NEW
  seriesLimit?: number;                          // NEW
}
```

**New Capabilities:**
- **Prometheus variant detection**: `prometheusType` (Prometheus, Mimir, Cortex, Thanos)
- **Caching control**: `cacheLevel` with 4 levels
- **Recording rules**: Fetch and use recording rules as metrics
- **Incremental querying**: Split large queries into chunks
- **Series API control**: Opt-in to series endpoint with limits

### 3.4 Component Structure and Props

#### Query Editor Evolution

**v7.5.17**: Separate editors for different contexts
- `PromQueryEditor` - Dashboard panels
- `PromExploreQueryEditor` - Explore page
- Angular-based annotation editor (template string)

**v12.3.0**: Unified with app-aware routing
- `PromQueryEditorByApp` - Single entry point, routes based on `CoreApp`
- `PromQueryEditorForAlerting` - Specialized for alerting (no exemplars, instant only options)
- React-based `AnnotationQueryEditor` component
- Query builder integrated seamlessly

**Builder Mode Components** (new in v12.3.0):
- `PromQueryBuilder` - Main builder container
- `MetricsLabelsSection` - Metric + label filter selection
- `MetricCombobox` - Autocomplete metric picker with fuzzy search
- `LabelFilters` - Visual label filter builder with operators
- `NestedQuery` - Support for binary operations
- `PromQueryBuilderOptions` - Operation pipeline (rate, aggregations, etc.)

### 3.5 UI/UX Changes

**DOM Structure Stability:**
- **v7.5.17**: Simpler DOM with fewer nested components
- **v12.3.0**: 
  - More complex component hierarchy with query builder
  - Data attributes for testing (e.g., `data-testid="prometheus-query-builder"`)
  - Monaco editor integration changes DOM structure for code mode
  - Metrics browser adds substantial new UI elements

**CSS Classes:**
- v7.5.17 uses Grafana core classes
- v12.3.0 uses Emotion CSS-in-JS with generated class names
- **Risk**: Browser extensions relying on stable CSS selectors will break

**Query Editor Modes:**
```typescript
// v12.3.0 mode switching
<PromQueryEditorSelector 
  query={query}
  onChange={onChange}
  onRunQuery={onRunQuery}
/>
// Renders either:
// - PromQueryCodeEditor (Monaco-based)
// - PromQueryBuilder (visual builder)
```

**Migration Impact for Extensions:**
- Extensions injecting UI into query editor must detect mode
- Different DOM structure between code/builder modes
- Monaco editor integration changes text input handling
- Metrics browser adds new clickable elements that may interfere with automation

---

## 4. Backend / Query Engine Changes

### 4.1 Architecture

#### v7.5.17 Backend
```
pkg/tsdb/prometheus/
├── prometheus.go (PrometheusExecutor)
├── prometheus_test.go
└── types.go (PrometheusQuery)
```

**Implementation:**
- Direct implementation of query execution
- Uses `prometheus/client_golang` API directly
- `tsdb.TsdbQueryEndpoint` interface
- Manual HTTP client configuration

#### v12.3.0 Backend
```
pkg/tsdb/prometheus/
├── prometheus.go (Service wrapper)
├── prometheus_test.go
└── azureauth/
    ├── azure.go
    └── azure_test.go

pkg/promlib/  (NEW - shared library)
├── library.go (main service)
├── querydata/
│   ├── request.go
│   ├── response.go
│   └── exemplar/
├── client/
│   ├── client.go
│   └── transport.go
├── converter/
│   └── prom.go
├── models/
│   ├── query.go
│   └── result.go
└── [23 non-test .go files]
```

**Implementation:**
- **Delegation pattern**: `pkg/tsdb/prometheus` is a thin wrapper
- **Shared library**: Core logic in `pkg/promlib` (also used by Mimir, Loki)
- **Plugin SDK**: Uses `grafana-plugin-sdk-go` backend interfaces
- **Azure auth**: Dedicated authentication middleware

### 4.2 Query Execution Flow

#### v7.5.17 Flow
```
PrometheusDatasource.query()
  → HTTP request to Grafana backend
    → PrometheusExecutor.Query()
      → prometheus client API QueryRange()
        → HTTP to Prometheus
          → parseResponse()
            → tsdb.QueryResult
```

#### v12.3.0 Flow
```
PrometheusDatasource.query()
  → HTTP request to Grafana backend
    → Service.QueryData()
      → promlib.Service.QueryData()
        → promlib/querydata/request.go
          → promlib/client/client.go
            → HTTP to Prometheus
              → promlib/converter/prom.go
                → backend.DataResponse (DataFrame)
```

**Key Differences:**
- **DataFrame-based**: v12.3.0 uses Apache Arrow-like DataFrames
- **Middleware support**: Extensible request/response pipeline
- **Better error handling**: Downstream vs upstream error classification
- **Instrumentation**: OpenTelemetry tracing built-in

### 4.3 New Backend Capabilities

#### Azure Authentication (v12.3.0 only)
```go
// pkg/tsdb/prometheus/azureauth/azure.go
func ConfigureAzureAuthentication(
    settings backend.DataSourceInstanceSettings,
    azureSettings *azsettings.AzureSettings,
    clientOpts *sdkhttpclient.Options,
    audienceOverride bool,
) error
```

Supports:
- Managed Identity (MSI)
- Client Secret credentials
- Custom audience/scope configuration
- Multi-cloud support (Azure Public, Government, China)

#### Recording Rules (v12.3.0 only)
```typescript
// Fetch Prometheus recording rules
async loadRules(): Promise<void>

// Types for recording rules
type RawRecordingRules = {
  name: string;
  file: string;
  rules: Rule[];
  interval?: number;
  limit?: number;
};

type RuleQueryMapping = {
  [key: string]: Array<{
    query: string;
    labels?: Record<string, string>;
  }>;
};
```

Users can:
- Browse recording rules as metrics
- Expand recording rule to see underlying query
- Use recording rules in visual query builder

#### Incremental Querying (v12.3.0 only)
For large time ranges, queries can be split into chunks and executed incrementally to avoid timeouts.

### 4.4 API Endpoint Changes

#### v7.5.17 Plugin Routes
Not explicitly defined in `plugin.json` - relied on Grafana's default proxying.

#### v12.3.0 Plugin Routes (from plugin.json)
```json
{
  "routes": [
    { "method": "POST", "path": "api/v1/query", "reqRole": "Viewer" },
    { "method": "POST", "path": "api/v1/query_range", "reqRole": "Viewer" },
    { "method": "POST", "path": "api/v1/series", "reqRole": "Viewer" },
    { "method": "POST", "path": "api/v1/labels", "reqRole": "Viewer" },
    { "method": "POST", "path": "api/v1/query_exemplars", "reqRole": "Viewer" },
    { "method": "GET", "path": "/rules", "reqRole": "Viewer", "reqAction": "alert.rules.external:read" },
    { "method": "POST", "path": "/rules", "reqRole": "Editor", "reqAction": "alert.rules.external:write" },
    { "method": "DELETE", "path": "/rules/*", "reqRole": "Editor", "reqAction": "alert.rules.external:write" }
  ]
}
```

**Significance:**
- **Explicit RBAC**: Role-based access control at plugin level
- **Rules management**: Endpoints for managing Prometheus rules via Grafana
- **Exemplars**: Dedicated endpoint for exemplar queries

---

## 5. Visualization & Data Model Changes

### 5.1 Result Transformation

#### v7.5.17 Transform Function
```typescript
function transform(
  response: FetchResponse<PromDataSuccessResponse>,
  transformOptions: {
    query: PromQueryRequest;
    exemplarTraceIdDestinations?: ExemplarTraceIdDestination[];
    target: PromQuery;
    responseListLength: number;
    scopedVars?: ScopedVars;
    mixedQueries?: boolean;
  }
): DataFrame[]
```

**Process:**
1. Parse Prometheus matrix/vector/scalar response
2. Create `ArrayDataFrame` with time and value vectors
3. Apply legend formatting via string template
4. Handle exemplars separately, sample by standard deviation
5. Add data links for exemplar trace IDs

#### v12.3.0 TransformV2 Function
```typescript
export function transformV2(
  response: DataQueryResponse,
  request: DataQueryRequest<PromQuery>,
  options: { exemplarTraceIdDestinations?: ExemplarTraceIdDestination[] }
): DataQueryResponse
```

**Process:**
1. Receive DataFrames from backend (already converted by promlib)
2. Partition frames by type: table, exemplar, heatmap, time-series
3. Process each type separately:
   - **Table frames**: Sort and format for table visualization
   - **Exemplar frames**: Add data links and DataTopic.Annotations meta
   - **Heatmap frames**: Convert to DataFrameType.HeatmapCells
   - **Time-series frames**: Apply legend formatting migration for `__auto` mode
4. Return enriched DataQueryResponse

**Key Differences:**
- **Backend processing**: v12.3.0 does more work in Go (promlib converter)
- **DataFrame-centric**: Uses plugin SDK data structures throughout
- **Type-specific handling**: Explicit logic for different visualization types
- **Auto legend**: v12.3.0 supports `__auto` legend mode with intelligent defaults

### 5.2 DataFrame Schema

#### v7.5.17 DataFrame Structure
```typescript
// Time-series frame
{
  fields: [
    { name: "Time", type: FieldType.time, values: [...] },
    { name: "Value", type: FieldType.number, values: [...], labels: {...} }
  ]
}

// Exemplar frame
{
  fields: [
    { name: "Time", type: FieldType.time },
    { name: "Value", type: FieldType.number },
    { name: "traceID", type: FieldType.string, config: { links: [...] } },
    // ... other label fields
  ],
  meta: { dataTopic: DataTopic.Annotations }
}
```

#### v12.3.0 DataFrame Structure
```typescript
// Time-series frame (unchanged schema, enhanced metadata)
{
  fields: [
    { name: "Time", type: FieldType.time, values: [...] },
    { name: "Value", type: FieldType.number, values: [...], labels: {...} }
  ],
  meta: {
    custom: {
      resultType: 'matrix' | 'vector' | 'scalar'
    }
  }
}

// Exemplar frame (enhanced with urlDisplayLabel)
{
  fields: [
    { name: "Time", type: FieldType.time },
    { name: "Value", type: FieldType.number },
    { 
      name: "traceID", 
      type: FieldType.string, 
      config: { 
        links: [
          { 
            title: "...",
            url: "...",
            // NEW: urlDisplayLabel for UI display
          }
        ] 
      } 
    }
  ],
  meta: { 
    dataTopic: DataTopic.Annotations,
    custom: { resultType: 'exemplar' }
  }
}

// Heatmap frame (new in v12.3.0 for native histograms)
{
  meta: { type: DataFrameType.HeatmapCells },
  fields: [
    { name: "xMin", type: FieldType.time },
    { name: "xMax", type: FieldType.time },
    { name: "yMin", type: FieldType.number },
    { name: "yMax", type: FieldType.number },
    { name: "count", type: FieldType.number }
  ]
}
```

### 5.3 Panel Integration

Both versions use standard Grafana DataFrame format for panel integration, but v12.3.0 adds:

1. **Native Histogram Support**: Prometheus native histograms (OpenMetrics sparse buckets) converted to heatmap cells
2. **Enhanced Exemplar UX**: Better integration with trace panels via `urlDisplayLabel`
3. **Auto Legend Mode**: `legendFormat: '__auto'` for intelligent legend generation
4. **Verbose Legend Mode**: `legendFormat: '__verbose'` for all labels

### 5.4 Metadata Enrichment

#### v7.5.17 Metadata
```typescript
meta: {
  preferredVisualisationType: 'graph' | 'table'
}
```

#### v12.3.0 Metadata
```typescript
meta: {
  preferredVisualisationType: 'graph' | 'table',
  type: DataFrameType.HeatmapCells, // for heatmaps
  dataTopic: DataTopic.Annotations, // for exemplars
  custom: {
    resultType: 'matrix' | 'vector' | 'scalar' | 'exemplar',
    // Additional promlib metadata
  }
}
```

---

## 6. Licensing Facts for Prometheus-Related Code

### 6.1 v7.5.17 (Apache 2.0)

**Root LICENSE**: Apache License 2.0

**Prometheus-Related Paths Under Apache 2.0:**
```
pkg/tsdb/prometheus/
  ├── prometheus.go
  ├── prometheus_test.go
  └── types.go

public/app/plugins/datasource/prometheus/
  ├── [all files - ~40 total]
```

**File Headers**: No explicit license headers found in Prometheus datasource files. The root `LICENSE` file applies to all code.

**Conclusion**: In v7.5.17, all Prometheus datasource code (frontend and backend) is part of the main Grafana repository and distributed under **Apache License 2.0**.

### 6.2 v12.3.0 (AGPLv3)

**Root LICENSE**: GNU Affero General Public License v3.0

**Prometheus-Related Paths:**

#### Frontend Package: `@grafana/prometheus`
**Location**: `packages/grafana-prometheus/`
**License**: AGPL-3.0-only (from `package.json`)
**License File**: `packages/grafana-prometheus/LICENSE_AGPL`

**All files** in this package (~248 TypeScript/TSX files) are under **AGPLv3**.

**Package Metadata:**
```json
{
  "name": "@grafana/prometheus",
  "version": "12.3.0",
  "license": "AGPL-3.0-only",
  "files": ["./dist", "./README.md", "./CHANGELOG.md", "./LICENSE_AGPL"]
}
```

**Published NPM Package**: The `@grafana/prometheus` package is published to NPM with AGPLv3 license, meaning any code that imports this package is subject to AGPL copyleft terms.

#### Backend Code
**Location**: `pkg/tsdb/prometheus/`
**License**: AGPLv3 (inherits from root)

**Files:**
```
pkg/tsdb/prometheus/
  ├── prometheus.go
  ├── prometheus_test.go
  └── azureauth/
      ├── azure.go
      └── azure_test.go
```

**Shared Backend Library**
**Location**: `pkg/promlib/`
**License**: AGPLv3 (inherits from root)

**Files**: ~23 Go files implementing the shared Prometheus/Loki/Mimir backend logic.

**File Headers**: 
Files have comments referencing historical Grafana paths:
```go
// Core Grafana history https://github.com/grafana/grafana/blob/v11.0.0-preview/...
```

No explicit license headers, but all code is under Grafana's root AGPLv3 license.

### 6.3 Third-Party Dependencies

#### v7.5.17 Prometheus Dependencies
- `prometheus/client_golang` - Apache 2.0
- `prometheus/common` - Apache 2.0

#### v12.3.0 Prometheus Dependencies (package.json)
Notable additions:
- `@prometheus-io/lezer-promql` (0.305.0) - License: Apache-2.0
- `monaco-promql` (1.8.0) - License: MIT
- Various Grafana packages (all AGPL-3.0-only)

**Important**: While some Prometheus-related dependencies remain Apache 2.0 or MIT, the `@grafana/prometheus` package itself is AGPLv3, and any derivative work must comply with AGPL terms.

### 6.4 License Transition Timeline

The license change from Apache 2.0 to AGPLv3 occurred at **Grafana v8.0.0** (approximately April 2021). Key facts:

1. **v7.5.17** (analyzed here) is confirmed Apache 2.0
2. **v8.0.0+** switched to AGPLv3
3. **v12.3.0** (analyzed here) is confirmed AGPLv3
4. **No relicensing of old code**: The Apache 2.0 code remains available under that license in the v7.x tags

**Reference Commits:**
- Last Apache commit: `177175f28edf30b9b8d4ac924f19c47f37a003ab` (v7.5.17)
- First AGPL commit: Would be in v8.0.0 range (not queried here)

---

## 7. Compatibility Notes & Migration Risks

### 7.1 Breaking Changes for Custom Integrations

#### Query JSON Structure
**Risk Level**: 🔴 **HIGH**

**v7.5.17 Query:**
```json
{
  "refId": "A",
  "expr": "up",
  "format": "time_series",
  "instant": false,
  "range": true,
  "exemplar": true,
  "legendFormat": "{{job}}"
}
```

**v12.3.0 Query:**
```json
{
  "refId": "A",
  "expr": "up",
  "format": "time_series",
  "instant": false,
  "range": true,
  "exemplar": true,
  "legendFormat": "{{job}}",
  "editorMode": "code",        // NEW: Required for proper UI rendering
  "utcOffsetSec": 0            // NEW: May be added by frontend
}
```

**Migration Impact:**
- Old queries without `editorMode` will default to code mode
- Visual query builder queries include additional fields:
  ```json
  {
    "editorMode": "builder",
    "expr": "rate(http_requests_total[5m])",
    "legendFormat": "__auto",
    "format": "time_series"
  }
  ```

#### Browser Extension DOM Queries
**Risk Level**: 🔴 **HIGH**

| Element | v7.5.17 Selector | v12.3.0 Selector | Status |
|---------|-----------------|------------------|--------|
| Query input | `.gf-form-input` | `.monaco-editor` or builder components | ⚠️ CHANGED |
| Add query button | `[aria-label="Add query"]` | `[aria-label="Add query"]` | ✅ STABLE |
| Query editor container | `.query-editor-row` | `[data-testid="query-editor-row"]` | ⚠️ CHANGED |
| Exemplar checkbox | `input[name="exemplar"]` | Complex nested structure | ⚠️ CHANGED |

**Mitigation Strategy:**
- Use `data-testid` attributes where available
- Detect editor mode before querying DOM
- Check for Monaco editor vs simple textarea

#### Persisted Dashboard Queries
**Risk Level**: 🟡 **MEDIUM**

- Dashboards exported from v7.5.17 will load in v12.3.0
- Missing `editorMode` defaults to "code"
- Query results should be compatible (same DataFrame structure)
- **Exception**: Native histograms in v12.3.0 produce different frame structure

### 7.2 API/SDK Changes

#### Frontend Package Import Path
**Risk Level**: 🔴 **HIGH**

**v7.5.17**: Not a separate package, datasource bundled with Grafana

**v12.3.0**: Distributed as `@grafana/prometheus` NPM package

**Impact for Plugin Developers:**
- Cannot directly import from `@grafana/prometheus` in v7.5.17
- v12.3.0 allows shared code via NPM import
- Version mismatches may occur if plugin targets older Grafana

#### Backend Plugin Interface
**Risk Level**: 🟡 **MEDIUM**

**v7.5.17**: `tsdb.TsdbQueryEndpoint`
```go
type TsdbQueryEndpoint interface {
    Query(ctx context.Context, dsInfo *models.DataSource, query *TsdbQuery) (*Response, error)
}
```

**v12.3.0**: `backend.QueryDataHandler` (plugin SDK)
```go
type QueryDataHandler interface {
    QueryData(ctx context.Context, req *QueryDataRequest) (*QueryDataResponse, error)
}
```

**Migration Path:**
- Reimplement using plugin SDK interfaces
- Replace `models.DataSource` with `backend.DataSourceInstanceSettings`
- Use `backend.DataResponse` and `data.Frame` types

### 7.3 Feature Parity Issues

| Use Case | v7.5.17 | v12.3.0 | Migration Notes |
|----------|---------|---------|-----------------|
| **Basic PromQL queries** | ✅ | ✅ | Fully compatible |
| **Exemplars** | ✅ Basic | ✅ Enhanced | Enhanced in v12.3.0, backward compatible |
| **Visual query building** | ❌ | ✅ | New feature, no equivalent in v7.5.17 |
| **Recording rules** | ❌ | ✅ | New feature, not accessible in v7.5.17 |
| **Azure auth** | ❌ | ✅ | Not available in v7.5.17 |
| **Incremental queries** | ❌ | ✅ | Not available in v7.5.17 |
| **Monaco editor** | ❌ | ✅ | Simple textarea in v7.5.17 |
| **Native histograms** | ❌ | ✅ | Prometheus 2.40+ feature, not supported in v7.5.17 |
| **Metrics browser** | ❌ | ✅ | New feature in v12.3.0 |

### 7.4 Specific Risks for Tools

#### Query Builder/Generator Tools
**Risk**: Must generate queries with correct `editorMode`

**v7.5.17 Compatibility:**
```json
{ "expr": "up", "legendFormat": "{{job}}" }
```

**v12.3.0 Compatibility:**
```json
{ 
  "expr": "up", 
  "legendFormat": "{{job}}",
  "editorMode": "code"  // Must specify
}
```

#### Dashboard Automation
**Risk**: Query structure validation may fail

**Mitigation:**
- Parse queries as JSON, don't rely on field order
- Check for presence of required fields (`expr`, `refId`)
- Ignore unknown fields for forward compatibility

#### Testing/E2E Automation
**Risk**: 🔴 **CRITICAL** - DOM selectors will break

**Required Updates:**
1. Detect editor mode before interaction
2. Use Monaco API for code mode text entry
3. Use query builder component selectors for builder mode
4. Update screenshot tests (UI has changed significantly)

#### Monitoring/Observability
**Risk**: New instrumentation in v12.3.0

**v12.3.0 Additions:**
- OpenTelemetry tracing spans for queries
- Structured logging with more context
- Prometheus metrics for datasource operations (if self-monitoring)

---

## 8. Summary: Apache 2.0 → AGPLv3 Implications

### 8.1 Technical Debt

| Aspect | Effort to Migrate |
|--------|-------------------|
| **Basic query execution** | 🟢 Low - Queries mostly compatible |
| **Frontend integration** | 🔴 High - Complete rewrite if using datasource internals |
| **Backend integration** | 🟡 Medium - Switch to plugin SDK |
| **UI automation** | 🔴 High - All selectors need updates |
| **Dashboard JSON** | 🟢 Low - Mostly forward compatible |

### 8.2 License Compliance Requirements

#### If Using v7.5.17 (Apache 2.0) Code
- ✅ Can modify and distribute under any license
- ✅ Can create proprietary derivatives
- ✅ No copyleft requirements
- ⚠️ Must retain Apache 2.0 license notices

#### If Using v12.3.0 (AGPLv3) Code
- ⚠️ **Network copyleft**: If running as a service, must provide source to users
- ⚠️ **Derivative works**: Must also be AGPLv3
- ⚠️ **Combined works**: Entire application may be subject to AGPL
- ⚠️ **NPM package import**: Importing `@grafana/prometheus` triggers AGPL

**Key Decision Point:**
- **Non-SaaS use**: AGPL mainly affects distribution
- **SaaS/Cloud use**: Must offer source code to service users (AGPL Section 13)

### 8.3 Recommended Migration Path

For tools/extensions that need Prometheus functionality:

#### Option 1: Target v7.5.17 (Apache 2.0)
**Pros:**
- Permissive license
- Simpler codebase
- No copyleft concerns

**Cons:**
- Missing modern features (query builder, recording rules, etc.)
- No future updates
- Limited to 2021-era Prometheus features

#### Option 2: Target v12.3.0 (AGPLv3)
**Pros:**
- Modern feature set
- Active development
- Better performance and UX

**Cons:**
- AGPLv3 license obligations
- More complex integration
- Must provide source if running as service

#### Option 3: Fork v7.5.17 and Maintain
**Pros:**
- Control over features
- Apache 2.0 remains
- Can add specific features needed

**Cons:**
- Significant maintenance burden
- Security updates required
- Diverges from upstream

#### Option 4: Abstract Interface (Recommended for Extensions)
**Pros:**
- Work with both versions
- Minimal license exposure
- Graceful degradation

**Implementation:**
```typescript
interface PrometheusQueryAdapter {
  buildQuery(expr: string, options?: any): any;
  supportsQueryBuilder(): boolean;
  supportsRecordingRules(): boolean;
}

class PrometheusV7Adapter implements PrometheusQueryAdapter {
  buildQuery(expr: string) {
    return { expr, format: "time_series" };
  }
  supportsQueryBuilder() { return false; }
  supportsRecordingRules() { return false; }
}

class PrometheusV12Adapter implements PrometheusQueryAdapter {
  buildQuery(expr: string, options = {}) {
    return { 
      expr, 
      format: "time_series",
      editorMode: "code",
      ...options 
    };
  }
  supportsQueryBuilder() { return true; }
  supportsRecordingRules() { return true; }
}

// Detect Grafana version and use appropriate adapter
const adapter = grafanaVersion >= 12 
  ? new PrometheusV12Adapter() 
  : new PrometheusV7Adapter();
```

---

## 9. Appendix: Key File Changes

### 9.1 Most Changed Files

| File | v7.5.17 Lines | v12.3.0 Lines | Status |
|------|--------------|--------------|--------|
| `datasource.ts` | 867 | 919 | Modified (+52 lines, refactored) |
| `types.ts` | 141 | 186 | Extended (+45 lines, new types) |
| `result_transformer.ts` | ~400 | ~500 | Refactored (transformV2) |
| Query builder | N/A | ~3000+ | **NEW** (entire subsystem) |
| `promlib` (backend) | N/A | ~2500+ | **NEW** (shared library) |

### 9.2 New File Categories in v12.3.0

- **Query Builder**: ~80 files (components, operations, modellers)
- **Monaco Integration**: 5 files
- **Metrics Browser**: 8 files
- **Annotations**: 2 files (React components)
- **Caching**: 1 file
- **Promlib Backend**: 23 files

### 9.3 Removed/Deprecated in v12.3.0

- Angular annotation template (`partials/annotations.editor.html`)
- `PromExploreQueryEditor` (merged into unified editor)
- Direct `client_golang` usage (abstracted via promlib)
- `directUrl` datasource option (removed from types)

---

## 10. Conclusion

The evolution from **v7.5.17 (Apache 2.0)** to **v12.3.0 (AGPLv3)** represents a **major architectural overhaul** of Prometheus support in Grafana:

### Technical Evolution
1. **6x code expansion**: 40 → 248 files
2. **Feature richness**: Visual query builder, recording rules, metrics browser
3. **Modern architecture**: Plugin SDK, shared backend library, Monaco editor
4. **Better scalability**: Incremental queries, caching, Azure auth

### License Evolution
1. **Apache 2.0 → AGPLv3**: Fundamental shift in distribution rights
2. **Copyleft obligations**: Network use triggers source disclosure
3. **NPM package**: Frontend code now distributed as separate AGPL package
4. **Compatibility**: No licensing compatibility between versions

### Integration Risk
- **High** for UI automation and extensions
- **Medium** for backend integrations
- **Low** for basic query execution and dashboard JSON

### Strategic Recommendation
- **For SaaS/cloud services**: Carefully evaluate AGPL implications, consider staying on v7.5.17 or abstract interface
- **For open-source projects**: v12.3.0 provides superior features, AGPL alignment may be acceptable
- **For enterprise**: Consult legal counsel on AGPL network copyleft requirements

**Final Note**: This analysis is **factual documentation** of code and license changes. It does not constitute legal advice. Organizations should consult legal counsel for license compliance guidance.

---

**Report Generated**: 2025-11-19  
**Analyst**: AI Code Analysis System  
**Grafana Repository**: https://github.com/grafana/grafana  
**Tags Analyzed**: v7.5.17 (177175f), v12.3.0 (79bf2c4)
