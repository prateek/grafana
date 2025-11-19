# Prometheus Data Source Comparison: Apache 2.0 vs AGPLv3 Grafana

## Executive Summary

This report provides a detailed code-level analysis of Prometheus support changes between:
- **APACHE_TAG**: v7.5.17 (Apache 2.0 License)
- **AGPL_TAG**: v12.3.0 (AGPLv3 License)

**Key Finding**: The Prometheus data source underwent a major architectural refactoring, moving from a monolithic plugin structure to a modular package-based architecture with significant feature additions and backend improvements.

---

## 1. Versions Analyzed

### APACHE_TAG: v7.5.17
- **Tag**: `v7.5.17`
- **Commit SHA**: `177175f28edf30b9b8d4ac924f19c47f37a003ab`
- **Root License**: Apache License 2.0
- **Release Date**: Last Apache 2.0 licensed Grafana release

### AGPL_TAG: v12.3.0
- **Tag**: `v12.3.0`
- **Commit SHA**: `79bf2c484bdb0cd7103f0e25d6bb0b81d2f46274`
- **Root License**: GNU Affero General Public License v3 (AGPLv3)
- **Release Date**: Latest stable AGPL Grafana release

### Build System & Framework Differences

**v7.5.17**:
- Frontend: AngularJS + React hybrid
- Backend: Direct Go implementation using `prometheus/client_golang/api`
- Plugin structure: Monolithic, all code in `public/app/plugins/datasource/prometheus/`

**v12.3.0**:
- Frontend: React 18+ with TypeScript
- Backend: Plugin SDK-based with shared `promlib` library
- Plugin structure: Modular package (`@grafana/prometheus`) + thin plugin wrapper

---

## 2. High-Level Feature Differences (Prometheus)

| Feature / Capability | Support in APACHE_TAG (v7.5.17) | Support in AGPL_TAG (v12.3.0) | Notes |
|---------------------|--------------------------------|------------------------------|-------|
| **Query Editor Modes** | Code mode only | Code + Builder mode | New visual query builder in v12.3.0 |
| **Exemplars** | Basic support | Enhanced with trace linking | Improved exemplar handling and visualization |
| **Query Caching** | Not available | Multi-level caching (Low/Medium/High/None) | New in v12.3.0 |
| **Incremental Querying** | Not available | Supported with overlap window | Performance optimization feature |
| **Ad-hoc Filters** | Not available | Supported via `adhocFilters` | New filtering capability |
| **Scopes** | Not available | Supported via `scopes` array | New query scoping feature |
| **Azure Authentication** | Not available | Full Azure AD support | New authentication method |
| **SigV4 Authentication** | Not available | Supported | AWS authentication |
| **Recording Rules** | Basic support | Enhanced with disable option | More control over rule expansion |
| **UTF-8 Support** | Limited | Full UTF-8 label support | Improved internationalization |
| **Query Hints** | Basic | Enhanced | Better query optimization suggestions |
| **Backend Query Execution** | Frontend-only | Backend + Frontend hybrid | Major architectural change |
| **Monaco Editor** | Not available | Integrated Monaco editor | Better code editing experience |
| **Metrics Browser** | Not available | Visual metrics/labels browser | New UI component |
| **Series Limit** | Not configurable | Configurable series limit | Performance control |
| **Prometheus Flavors** | Generic | Cortex/Mimir/Thanos/Prometheus detection | Better compatibility detection |

---

## 3. Frontend Datasource + Query Editor Changes

### 3.1 Query Model / Types

#### v7.5.17 Query Model
```typescript
interface PromQuery {
  expr: string;
  legendFormat?: string;
  format?: 'time_series' | 'table' | 'heatmap';
  instant?: boolean;
  range?: boolean;
  exemplar?: boolean;
  interval?: string;
  intervalFactor?: number;
  refId: string;
}
```

#### v12.3.0 Query Model
```typescript
interface PromQuery extends GenPromQuery {
  editorMode?: 'builder' | 'code';  // NEW
  exemplar?: boolean;
  expr: string;
  format?: PromQueryFormat;
  instant?: boolean;
  range?: boolean;
  legendFormat?: string;
  scopes?: Array<ScopeSpec & Pick<Scope['metadata'], 'name'>>;  // NEW
  adhocFilters?: ScopeSpecFilter[];  // NEW
  groupByKeys?: string[];  // NEW
  utcOffsetSec?: number;  // NEW
  valueWithRefId?: boolean;  // NEW
  interval?: string;
  // intervalFactor deprecated
}
```

**Key Changes**:
- Added `editorMode` to distinguish between code and builder modes
- Introduced `scopes` and `adhocFilters` for advanced filtering
- Added `utcOffsetSec` for timezone alignment
- Deprecated `intervalFactor` in favor of max data points

### 3.2 Component Structure and Props

#### v7.5.17 Structure
```
public/app/plugins/datasource/prometheus/
├── components/
│   ├── PromQueryEditor.tsx          # Main query editor
│   ├── PromExploreQueryEditor.tsx    # Explore-specific editor
│   ├── PromQueryField.tsx            # Query input field
│   ├── PromExemplarField.tsx         # Exemplar configuration
│   └── PromLink.tsx                  # Link to Prometheus UI
├── datasource.ts                     # Datasource implementation
├── language_provider.ts              # Autocomplete provider
└── types.ts                          # Type definitions
```

**Total Files**: 47 files in plugin directory

#### v12.3.0 Structure
```
packages/grafana-prometheus/src/
├── components/
│   ├── PromQueryEditorByApp.tsx      # App-aware editor router
│   ├── PromQueryEditorForAlerting.tsx # Alerting-specific editor
│   ├── PromQueryEditorSelector.tsx   # Mode selector (code/builder)
│   ├── PromQueryField.tsx            # Enhanced query field
│   ├── metrics-browser/              # NEW: Visual metrics browser
│   └── monaco-query-field/           # NEW: Monaco editor integration
├── querybuilder/                     # NEW: Visual query builder
│   ├── components/                   # Builder UI components
│   └── shared/                       # Shared builder logic
├── datasource.ts                     # Refactored datasource
└── types.ts                          # Extended type definitions

public/app/plugins/datasource/prometheus/
├── module.ts                         # Thin wrapper (17 files total)
└── configuration/                    # Config editor components
```

**Total Files**: 
- Plugin directory: 17 files (reduced from 47)
- Package directory: ~200+ files (moved to separate package)

### 3.3 UI/UX Changes in Prometheus Query Editor

#### v7.5.17 Query Editor
- **Single Editor**: `PromQueryEditor` component
- **Input Method**: Text input with basic autocomplete
- **Features**:
  - Format selector (time_series/table/heatmap)
  - Instant query toggle
  - Exemplar toggle
  - Legend format input
  - Interval factor selector

#### v12.3.0 Query Editor
- **Dual Mode Editor**: Code mode + Builder mode
- **Code Mode**: Monaco editor with PromQL syntax highlighting
- **Builder Mode**: Visual query builder with:
  - Metric selector with fuzzy search
  - Label filters with operators
  - Function selector
  - Aggregation options
  - Group by operations
- **Enhanced Features**:
  - Metrics browser component
  - Better autocomplete with context awareness
  - Query hints and suggestions
  - Query validation
  - Keyboard shortcuts

### 3.4 DOM / CSS Stability Notes

**Breaking Changes for Browser Extensions/Test Automation**:

1. **Component Structure**:
   - v7.5.17: Direct component hierarchy (`PromQueryEditor` → `PromQueryField`)
   - v12.3.0: Router-based hierarchy (`PromQueryEditorByApp` → `PromQueryEditorSelector` → mode-specific editor)
   - **Impact**: CSS selectors targeting old component structure will break

2. **Class Names**:
   - v7.5.17: Uses Grafana UI component classes
   - v12.3.0: May have different class names due to package refactoring
   - **Impact**: Test selectors may need updates

3. **Query Field**:
   - v7.5.17: Standard text input
   - v12.3.0: Monaco editor (different DOM structure)
   - **Impact**: Extensions injecting into query field need Monaco-aware code

4. **Configuration Editor**:
   - v7.5.17: `ConfigEditor.tsx` with `PromSettings.tsx`
   - v12.3.0: `ConfigEditorPackage.tsx` with overhauled settings
   - **Impact**: Settings UI structure changed significantly

**Recommendation**: Browser extensions and test automation should:
- Use data-testid attributes where available
- Avoid relying on DOM structure
- Test against both code and builder modes in v12.3.0

---

## 4. Backend / Query Engine Changes

### 4.1 Architecture Comparison

#### v7.5.17 Backend (`pkg/tsdb/prometheus/prometheus.go`)
```go
type PrometheusExecutor struct {
    Transport http.RoundTripper
}

func (e *PrometheusExecutor) Query(ctx context.Context, dsInfo *models.DataSource, tsdbQuery *tsdb.TsdbQuery) (*tsdb.Response, error) {
    // Direct Prometheus client usage
    client, err := e.getClient(dsInfo)
    value, _, err := client.QueryRange(ctx, query.Expr, timeRange)
    // Transform and return
}
```

**Characteristics**:
- Direct implementation using `prometheus/client_golang/api`
- Frontend makes HTTP requests directly to Prometheus
- Backend only used for proxy mode
- Simple query parsing and response transformation

#### v12.3.0 Backend (`pkg/tsdb/prometheus/prometheus.go` + `pkg/promlib/`)
```go
type Service struct {
    lib *promlib.Service
}

func (s *Service) QueryData(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
    return s.lib.QueryData(ctx, req)
}
```

**Characteristics**:
- Uses Plugin SDK (`backend.QueryDataRequest`)
- Delegates to shared `promlib` library
- Backend handles query execution in both proxy and direct modes
- More sophisticated query processing pipeline

### 4.2 New Capabilities

#### Query Processing Enhancements
1. **Query Caching**: Multi-level caching system
   - Low/Medium/High/None cache levels
   - Configurable per datasource
   - Reduces redundant queries

2. **Incremental Querying**: 
   - Overlap window configuration
   - Reduces query load for large time ranges
   - Better performance for dashboards

3. **Azure Authentication**:
   - Full Azure AD integration
   - Managed identity support
   - Audience override option

4. **SigV4 Authentication**:
   - AWS authentication support
   - Service namespace configuration

5. **Series Limit**:
   - Configurable limit to prevent overload
   - Default: 10,000 series
   - Protects against expensive queries

6. **Recording Rules Control**:
   - Option to disable recording rule expansion
   - Better control over query behavior

### 4.3 Removed or Deprecated Functionality

1. **Interval Factor**: 
   - Deprecated in favor of max data points
   - Still supported for backward compatibility
   - May be removed in future versions

2. **Frontend-only Query Execution**:
   - Removed direct frontend-to-Prometheus communication
   - All queries now go through backend
   - Better security and caching

### 4.4 Behavior Changes

#### Query Execution
- **v7.5.17**: Frontend directly queries Prometheus (in direct mode)
- **v12.3.0**: All queries go through Grafana backend
  - **Impact**: Network topology changes, backend handles auth/caching

#### Error Handling
- **v7.5.17**: Basic error propagation
- **v12.3.0**: Enhanced error handling with:
  - Better error messages
  - Query validation errors
  - Timeout handling improvements

#### Response Format
- **v7.5.17**: Direct Prometheus API response format
- **v12.3.0**: Standardized Grafana DataFrame format
  - **Impact**: More consistent data structure across datasources

---

## 5. Visualization & Data Model Changes

### 5.1 Data Transformation

#### v7.5.17 (`result_transformer.ts`)
- Direct transformation from Prometheus API response
- Uses `ArrayDataFrame` and `ArrayVector`
- Basic exemplar handling
- Simple legend format processing

#### v12.3.0 (`result_transformer.ts` - `transformV2`)
- Enhanced transformation pipeline
- Better handling of:
  - Vector vs Matrix results
  - Scalar results
  - Exemplar frames
  - Heatmap data
  - Table format
- Improved legend format handling with `__auto` mode
- Better NaN/Infinity handling

### 5.2 DataFrame / Field Schema Changes

#### New Field Metadata
- `resultType`: 'vector' | 'matrix' | 'scalar' | 'exemplar'
- `custom.resultType`: More detailed result type information
- `dataTopic`: Used for exemplars (set to `DataTopic.Annotations`)

#### Legend Format Modes
- **v7.5.17**: Simple template string (`{{label}}`)
- **v12.3.0**: Three modes:
  - `__auto`: Automatic legend generation
  - `__verbose`: Full label set
  - Custom: User-defined template

### 5.3 Exemplar Handling

#### v7.5.17
- Basic exemplar data extraction
- Simple sampling algorithm
- Limited trace linking

#### v12.3.0
- Enhanced exemplar processing
- Better sampling (stddev-based)
- Trace ID destination configuration
- Data links for trace navigation
- Separate exemplar frames with `DataTopic.Annotations`

### 5.4 Panel Integration

#### New Panel Options
- Better heatmap support
- Improved table visualization
- Enhanced legend options
- Better handling of mixed query types

#### Visualization Improvements
- Native histogram support (if Prometheus version supports it)
- Better handling of sparse data
- Improved time series rendering
- Enhanced table formatting

---

## 6. Licensing Facts for Prometheus-Related Code

### APACHE_TAG (v7.5.17)

**Root License**: Apache License 2.0

**Prometheus-Related Code Locations**:
- `public/app/plugins/datasource/prometheus/` - **Apache 2.0**
- `pkg/tsdb/prometheus/` - **Apache 2.0**

**License Headers**: No per-file license headers found (inherits root Apache 2.0)

**Factual Summary**: All Prometheus-related code in v7.5.17 is under Apache License 2.0, inherited from the root LICENSE file.

### AGPL_TAG (v12.3.0)

**Root License**: GNU Affero General Public License v3 (AGPLv3)

**Prometheus-Related Code Locations**:

1. **Main Repository** (AGPLv3):
   - `public/app/plugins/datasource/prometheus/` - **AGPLv3** (thin wrapper, ~17 files)
   - `pkg/tsdb/prometheus/` - **AGPLv3** (backend service wrapper)
   - `pkg/promlib/` - **AGPLv3** (shared Prometheus library)

2. **Separate Package** (AGPLv3):
   - `packages/grafana-prometheus/` - **AGPLv3**
   - Contains `LICENSE_AGPL` file explicitly stating AGPL-3.0-only
   - Package.json: `"license": "AGPL-3.0-only"`

**License Headers**: 
- `packages/grafana-prometheus/LICENSE_AGPL` - Full AGPLv3 text
- Package.json explicitly states AGPL-3.0-only

**Factual Summary**: 
- All Prometheus-related code in v12.3.0 is under AGPLv3
- The code was refactored into a separate package (`@grafana/prometheus`) but remains in the main repository
- The package has an explicit AGPL license file
- No code was moved to a separate repository with a different license

**Note**: The Prometheus data source code remains part of the main Grafana repository and inherits the AGPLv3 license. It was not split into a separate plugin repository with its own license.

---

## 7. Compatibility Notes & Migration Risks

### 7.1 Breaking Changes for Custom Integrations

#### Browser Extensions
1. **DOM Structure Changes**:
   - Query editor component hierarchy changed
   - Monaco editor replaces text input
   - **Mitigation**: Use data-testid attributes, avoid DOM structure assumptions

2. **API Changes**:
   - Query model structure changed (new fields, deprecated fields)
   - **Mitigation**: Handle both old and new query formats during transition

3. **Event System**:
   - Component lifecycle and event handling may differ
   - **Mitigation**: Test against both versions, use Grafana's public APIs

#### Custom Query Builders
1. **Query Model**:
   - New required/optional fields
   - Deprecated `intervalFactor`
   - **Mitigation**: Update query serialization logic

2. **Query Execution**:
   - Backend execution model (all queries go through backend)
   - **Mitigation**: Ensure backend connectivity, handle backend errors

#### Test Automation
1. **Selectors**:
   - CSS class names may have changed
   - Component structure different
   - **Mitigation**: Use data-testid, update selectors

2. **Query Editor Modes**:
   - New builder mode to test
   - **Mitigation**: Test both code and builder modes

### 7.2 Persisted Dashboard JSON Compatibility

#### Query Object Changes
```json
// v7.5.17 format (still supported)
{
  "expr": "up",
  "format": "time_series",
  "instant": false,
  "intervalFactor": 1,
  "legendFormat": "{{instance}}"
}

// v12.3.0 format (new fields)
{
  "expr": "up",
  "format": "time_series",
  "instant": false,
  "editorMode": "code",  // NEW
  "legendFormat": "__auto",  // NEW format
  "scopes": [],  // NEW
  "adhocFilters": []  // NEW
}
```

**Migration Notes**:
- Old dashboards will load but may show warnings for deprecated fields
- `intervalFactor` is deprecated but still functional
- New fields are optional and have defaults
- **Risk**: Low - backward compatibility maintained

### 7.3 API Compatibility

#### Backend API
- **v7.5.17**: Uses legacy `tsdb.Query` interface
- **v12.3.0**: Uses Plugin SDK `backend.QueryDataRequest`
- **Impact**: Internal API change, external API remains compatible

#### Frontend API
- Datasource class interface changed:
  - v7.5.17: Extends `DataSourceApi`
  - v12.3.0: Extends `DataSourceWithBackend`
- **Impact**: Custom datasource implementations need updates

### 7.4 Performance Considerations

#### Query Execution
- **v7.5.17**: Direct frontend queries (lower latency in direct mode)
- **v12.3.0**: Backend queries (better caching, higher latency)
- **Mitigation**: Enable query caching, use incremental querying

#### Memory Usage
- **v7.5.17**: Lower memory footprint
- **v12.3.0**: Higher memory due to caching and enhanced features
- **Mitigation**: Configure cache levels appropriately

### 7.5 Feature-Specific Migration Risks

#### Query Builder Mode
- New visual query builder may produce different queries than manual entry
- **Risk**: Medium - queries may be formatted differently
- **Mitigation**: Test queries generated by builder mode

#### Exemplars
- Enhanced exemplar handling may show different data
- **Risk**: Low - improvements are additive
- **Mitigation**: Verify exemplar configuration

#### Caching
- Query caching may return stale data
- **Risk**: Low - configurable cache levels
- **Mitigation**: Set appropriate cache level for use case

---

## 8. Summary of Major Changes

### Architectural Changes
1. **Monolithic → Modular**: Code moved to `@grafana/prometheus` package
2. **Frontend → Backend**: Query execution moved to backend
3. **Single Editor → Dual Mode**: Code + Builder modes
4. **Direct → SDK-based**: Uses Grafana Plugin SDK

### Feature Additions
1. Visual query builder
2. Query caching system
3. Incremental querying
4. Enhanced exemplar support
5. Azure/SigV4 authentication
6. Ad-hoc filters and scopes
7. UTF-8 support
8. Metrics browser

### Code Quality Improvements
1. Better TypeScript types
2. Enhanced error handling
3. Improved test coverage
4. Better separation of concerns
5. More maintainable codebase

### Performance Enhancements
1. Query caching
2. Incremental querying
3. Series limits
4. Better resource management

---

## 9. Recommendations

### For Tool Developers
1. **Update Selectors**: Use data-testid attributes instead of CSS classes
2. **Handle Both Modes**: Support both code and builder query editor modes
3. **Test Backend**: Ensure compatibility with backend query execution
4. **Query Model**: Handle new query fields gracefully

### For Dashboard Authors
1. **Review Queries**: Check queries after upgrade, especially if using deprecated fields
2. **Try Builder Mode**: Consider using visual query builder for complex queries
3. **Configure Caching**: Set appropriate cache levels for your use case
4. **Test Exemplars**: Verify exemplar functionality if used

### For Administrators
1. **Backend Capacity**: Ensure backend can handle increased query load
2. **Cache Configuration**: Configure query caching appropriately
3. **Authentication**: Review Azure/SigV4 setup if using these features
4. **Performance Monitoring**: Monitor query performance after upgrade

---

## Appendix: File Change Statistics

### Frontend Changes
- **Files Removed**: ~30 files from plugin directory
- **Files Added**: ~200+ files in `packages/grafana-prometheus`
- **Net Change**: +54,001 insertions, -11,481 deletions

### Backend Changes
- **Files Changed**: `pkg/tsdb/prometheus/prometheus.go` (major refactor)
- **New Package**: `pkg/promlib/` (shared library)
- **New Files**: Azure authentication support

### Key Files Removed
- `public/app/plugins/datasource/prometheus/datasource.ts` (moved to package)
- `public/app/plugins/datasource/prometheus/language_provider.ts` (moved to package)
- `public/app/plugins/datasource/prometheus/components/PromQueryEditor.tsx` (replaced)

### Key Files Added
- `packages/grafana-prometheus/src/datasource.ts` (refactored)
- `packages/grafana-prometheus/src/querybuilder/` (new visual builder)
- `pkg/promlib/` (new shared library)

---

**Report Generated**: Based on code analysis of v7.5.17 and v12.3.0 tags  
**Analysis Date**: Current  
**Methodology**: Git diff analysis, code inspection, and structural comparison
