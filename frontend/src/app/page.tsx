'use client';

import { useState, useEffect } from 'react';

interface SearchItem {
  id: string;
  name: string;
  description: string;
  brand: string;
  category: string;
  tags: string[];
  price: number;
  rating: number;
  stock: number;
  score?: number;
  highlights?: {
    name?: string[];
    description?: string[];
  };
}

interface SearchResult {
  engine: string;
  latencyMs: number;
  totalHits: number;
  items: SearchItem[];
  queryInfo: {
    rawQuery: string;
    explainText?: string;
    tokens?: string[];
  };
}

interface BenchmarkReport {
  engine: string;
  totalQueries: number;
  avg: number;
  min: number;
  max: number;
  p50: number;
  p90: number;
  p99: number;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'playground' | 'comparison' | 'benchmarks' | 'docs'>('playground');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEngine, setSelectedEngine] = useState<string>('like');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Comparative Search results
  const [compareResults, setCompareResults] = useState<Record<string, SearchResult | null>>({
    like: null,
    ilike: null,
    trigram: null,
    fts: null,
    elasticsearch: null,
  });
  const [compareLoading, setCompareLoading] = useState(false);

  // Benchmark results
  const [benchmarkRuns, setBenchmarkRuns] = useState<number>(20);
  const [benchmarkReports, setBenchmarkReports] = useState<BenchmarkReport[] | null>(null);
  const [benchmarkLoading, setBenchmarkLoading] = useState(false);

  // Engines list
  const engines = [
    { id: 'like', name: 'SQL LIKE', status: 'ready', desc: 'Case-sensitive substring search. Fits raw, exact patterns.' },
    { id: 'ilike', name: 'SQL ILIKE', status: 'ready', desc: 'Case-insensitive substring search. Simple, but slow.' },
    { id: 'trigram', name: 'Trigram Search', status: 'ready', desc: 'Trigram GIN indexing. Fuzzy matches & typo tolerance.' },
    { id: 'fts', name: 'Postgres FTS', status: 'ready', desc: 'Full-text tsvector/tsquery. Linguistic matching & lexemes.' },
    { id: 'elasticsearch', name: 'Elasticsearch', status: 'ready', desc: 'Lucene-powered BM25 search. Analyzers & fuzzy match.' },
  ];

  // Perform search in playground
  const performSearch = async (query: string, engine: string) => {
    if (!query.trim()) {
      setResults(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/search?q=${encodeURIComponent(query)}&engine=${engine}`);
      if (!res.ok) {
        throw new Error(`API error: ${res.statusText}`);
      }
      const data: SearchResult = await res.json();
      setResults(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message || 'An error occurred during search.');
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const performComparison = async (query: string) => {
    if (!query.trim()) return;
    setCompareLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/search/compare?q=${encodeURIComponent(query)}`);
      if (!res.ok) {
        throw new Error(`API error: ${res.statusText}`);
      }
      const data = await res.json();
      setCompareResults(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message || 'An error occurred during comparison.');
    } finally {
      setCompareLoading(false);
    }
  };
  const runBenchmark = async () => {
    setBenchmarkLoading(true);
    setBenchmarkReports(null);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/search/benchmark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runs: benchmarkRuns }),
      });
      if (!res.ok) {
        throw new Error(`API error: ${res.statusText}`);
      }
      const data: BenchmarkReport[] = await res.json();
      setBenchmarkReports(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message || 'Benchmark execution failed.');
    } finally {
      setBenchmarkLoading(false);
    }
  };

  // Trigger search on typing (debounced)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (activeTab === 'playground') {
        performSearch(searchQuery, selectedEngine);
      } else if (activeTab === 'comparison') {
        performComparison(searchQuery);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, selectedEngine, activeTab]);

  return (
    <div className="app-layout">
      {/* Background glow animations */}
      <div className="bg-glow-orange"></div>
      <div className="bg-glow-blue"></div>

      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h1 className="sidebar-title text-gradient-clip">
            Search Evolution
          </h1>
          <p className="sidebar-subtitle">From LIKE to Elasticsearch</p>
        </div>

        <nav className="sidebar-nav">
          <button
            onClick={() => setActiveTab('playground')}
            className={`nav-btn ${activeTab === 'playground' ? 'active' : ''}`}
          >
            🎯 Search Playground
          </button>

          <button
            onClick={() => setActiveTab('comparison')}
            className={`nav-btn ${activeTab === 'comparison' ? 'active' : ''}`}
          >
            ⚔️ Compare Engines
          </button>

          <button
            onClick={() => setActiveTab('benchmarks')}
            className={`nav-btn ${activeTab === 'benchmarks' ? 'active' : ''}`}
          >
            📊 Performance Benchmarks
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            className={`nav-btn ${activeTab === 'docs' ? 'active' : ''}`}
          >
            📖 How It Works
          </button>
        </nav>

        <div className="sidebar-footer">
          <p>Maintainer: Showcase App</p>
          <p className="font-mono">v1.0.0 (LIKE/ILIKE)</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        
        {/* TAB 1: Search Playground */}
        {activeTab === 'playground' && (
          <div className="animate-fade-in flex flex-col gap-4">
            <div className="header-container">
              <h2 className="header-title">Search Playground</h2>
              <p className="header-desc">
                Query individual search engines and explore their query syntax, performance, and SQL explain plans.
              </p>
            </div>

            {/* Playground Controls */}
            <div className="search-controls glass-panel">
              <div className="search-input-wrapper">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type a query (e.g. 'Apple Laptop Pro' or 'nike running')..."
                  className="search-input"
                />
              </div>

              {/* Engine Selector */}
              <div className="engine-badge-list">
                {engines.map((e) => (
                  <button
                    key={e.id}
                    disabled={e.status === 'locked'}
                    onClick={() => {
                      setSelectedEngine(e.id);
                      performSearch(searchQuery, e.id);
                    }}
                    className={`engine-badge-btn ${selectedEngine === e.id ? 'active' : ''}`}
                  >
                    {e.name} {e.status === 'locked' && '🔒'}
                  </button>
                ))}
              </div>
            </div>

            {/* Results Grid */}
            <div className="results-layout">
              
              {/* Product list */}
              <div className="results-column">
                <div className="results-header-info">
                  <span className="results-count">
                    Matching Products {results && `(${results.totalHits})`}
                  </span>
                  {results && (
                    <span className="results-latency">
                      Latency: {results.latencyMs} ms
                    </span>
                  )}
                </div>

                {loading ? (
                  <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Searching products database...
                  </div>
                ) : error ? (
                  <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', color: 'var(--accent-danger)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    ⚠️ {error}
                  </div>
                ) : !results || results.items.length === 0 ? (
                  <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    {searchQuery ? 'No products matched this term.' : 'Enter a query in the search bar above to begin.'}
                  </div>
                ) : (
                  <div className="product-list-container">
                    {results.items.map((item) => (
                      <div key={item.id} className="product-card glass-card">
                        <div className="product-card-title-row">
                          <div>
                            <h4
                              className="product-name"
                              dangerouslySetInnerHTML={{
                                __html: item.highlights?.name?.[0] || item.name,
                              }}
                            />
                            <p className="product-meta">
                              {item.brand} • <span style={{ color: 'var(--accent-primary)' }}>{item.category}</span>
                            </p>
                          </div>
                          <div className="product-price-col">
                            <span className="product-price">${item.price.toFixed(2)}</span>
                            {item.score !== undefined && item.score > 0 && (
                              <span className="product-score-badge" title="Relevance / Matching Score">
                                {selectedEngine === 'elasticsearch' ? 'BM25: ' : selectedEngine === 'trigram' ? 'Sim: ' : 'Rank: '}
                                {item.score.toFixed(3)}
                              </span>
                            )}
                          </div>
                        </div>
                        <p
                          className="product-desc"
                          dangerouslySetInnerHTML={{
                            __html: item.highlights?.description?.[0] || item.description,
                          }}
                        />
                        <div className="product-footer">
                          {item.tags.map((t) => (
                            <span key={t} className="tag-pill">
                              #{t}
                            </span>
                          ))}
                          <div className="product-stats">
                            <span>⭐ {item.rating}</span>
                            <span>Stock: {item.stock}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Side Educational Panel */}
              <div className="results-column">
                <div className="edu-panel">
                  <span className="edu-section-title">Engine Under The Hood</span>

                  <div className="edu-card glass-panel">
                    <div>
                      <h4 className="edu-card-title">
                        {engines.find((e) => e.id === selectedEngine)?.name}
                      </h4>
                      <p className="edu-card-desc">
                        {engines.find((e) => e.id === selectedEngine)?.desc}
                      </p>
                    </div>

                    {results && (
                      <div>
                        <div>
                          <span className="edu-label">
                            {selectedEngine === 'elasticsearch'
                              ? 'Elasticsearch Query DSL Payload'
                              : 'SQL Query Executed'}
                          </span>
                          <pre className="code-block">
                            {results.queryInfo.rawQuery}
                          </pre>
                        </div>

                        <div>
                          <span className="edu-label">
                            {selectedEngine === 'elasticsearch'
                              ? 'Engine Scoring & Architecture Details'
                              : 'Query Explain Plan (Postgres EXPLAIN)'}
                          </span>
                          <pre className="explain-block">
                            {results.queryInfo.explainText || 'No explain data available.'}
                          </pre>
                        </div>

                        {results.queryInfo.tokens && results.queryInfo.tokens.length > 0 && (
                          <div style={{ marginTop: '12px' }}>
                            <span className="edu-label">Analyzed Search Tokens / Lexemes</span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                              {results.queryInfo.tokens.map((tok, i) => (
                                <span key={i} className="tag-pill" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', borderColor: 'rgba(99, 102, 241, 0.3)' }}>
                                  {tok}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {!results && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0', fontFamily: 'var(--font-mono)' }}>
                        Query logs will appear here upon searching.
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: Engine Comparison */}
        {activeTab === 'comparison' && (
          <div className="animate-fade-in flex flex-col gap-4">
            <div className="header-container">
              <h2 className="header-title">Engine Comparison</h2>
              <p className="header-desc">
                Compare search outputs, latency speeds, scoring relevance, and query syntax across all platforms in real-time.
              </p>
            </div>

            <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Compare engines (e.g. 'Apple Pro' or 'jeans')..."
                className="search-input"
              />
            </div>

            {compareLoading ? (
              <div className="glass-panel" style={{ padding: '64px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Fetching side-by-side search results...
              </div>
            ) : !searchQuery.trim() ? (
              <div className="glass-panel" style={{ padding: '64px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Enter a query in the search bar above to trigger the comparison.
              </div>
            ) : (
              <div className="comparison-cols">
                {engines.map((e) => {
                  const data = compareResults[e.id];
                  return (
                    <div key={e.id} className="compare-col glass-panel">
                      <div className="compare-col-header">
                        <span className="compare-engine-name">{e.name}</span>
                        {e.status === 'locked' ? (
                          <span className="engine-status-badge locked">LOCKED</span>
                        ) : (
                          <span className="engine-status-badge active">ACTIVE</span>
                        )}
                      </div>

                      {data ? (
                        <>
                          <div className="compare-col-stats">
                            <span>Hits: {data.totalHits}</span>
                            {e.status !== 'locked' && <span>{data.latencyMs} ms</span>}
                          </div>

                          <div className="compare-items-list">
                            {data.items.length === 0 ? (
                              <div style={{ textAlign: 'center', padding: '40px 0', fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                {e.status === 'locked' ? 'Engine is locked.' : 'No matches.'}
                              </div>
                            ) : (
                              data.items.map((item) => (
                                <div key={item.id} className="compare-item-mini">
                                  <div className="compare-item-name">{item.name}</div>
                                  <div className="compare-item-price">{item.brand} • ${item.price}</div>
                                </div>
                              ))
                            )}
                          </div>

                          <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                            <span style={{ fontSize: '9px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
                              Raw Execution Payload
                            </span>
                            <pre className="code-block" style={{ maxHeight: '96px', fontSize: '9px' }}>
                              {data.queryInfo.rawQuery}
                            </pre>
                          </div>
                        </>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '80px 0', fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          No results fetched.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Benchmarks */}
        {activeTab === 'benchmarks' && (
          <div className="animate-fade-in flex flex-col gap-4">
            <div className="header-container">
              <h2 className="header-title">Performance Benchmarks</h2>
              <p className="header-desc">
                Execute parallel workloads against PostgreSQL indexes, raw scans, and Elasticsearch to visualize scaling properties under load.
              </p>
            </div>

            <div className="search-controls glass-panel">
              <div className="benchmark-controls">
                <span className="edu-card-desc" style={{ marginTop: 0 }}>Number of query runs:</span>
                <select
                  value={benchmarkRuns}
                  onChange={(e) => setBenchmarkRuns(Number(e.target.value))}
                  className="benchmark-select"
                  disabled={benchmarkLoading}
                >
                  <option value={10}>10 Runs (Fast)</option>
                  <option value={25}>25 Runs (Standard)</option>
                  <option value={50}>50 Runs (Thorough)</option>
                  <option value={100}>100 Runs (Stress Test)</option>
                </select>

                <button
                  onClick={runBenchmark}
                  disabled={benchmarkLoading}
                  className="benchmark-btn"
                >
                  {benchmarkLoading ? 'Executing Benchmark...' : 'Run Benchmark ⚡'}
                </button>
              </div>

              {benchmarkLoading && (
                <div style={{ textAlign: 'center', padding: '16px 0', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                  🚀 Sequentially querying all search engines with {benchmarkRuns} test terms. Please wait...
                </div>
              )}
            </div>

            {benchmarkReports && (
              <div className="animate-fade-in flex flex-col gap-4">
                {/* Visual Chart Card */}
                <div className="chart-card glass-panel">
                  <h3 className="edu-card-title" style={{ textAlign: 'center' }}>Average Latency Comparison (ms)</h3>
                  <p className="edu-card-desc" style={{ textAlign: 'center', marginBottom: '24px' }}>
                    Lower is better. Measures roundtrip DB/ES query execution time in milliseconds.
                  </p>

                  <div className="benchmark-chart-container">
                    {benchmarkReports.map((report) => {
                      const maxAvg = Math.max(...benchmarkReports.map(r => r.avg), 1);
                      const pct = (report.avg / maxAvg) * 85 + 5; // offset for minimum height visibility
                      return (
                        <div key={report.engine} className="chart-bar-col">
                          <span className="chart-value">{report.avg}ms</span>
                          <div
                            className="chart-bar"
                            style={{ height: `${pct}%`, background: report.engine === 'elasticsearch' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : undefined }}
                            title={`Avg: ${report.avg}ms, P99: ${report.p99}ms`}
                          ></div>
                          <span className="chart-label">
                            {engines.find(e => e.id === report.engine)?.name || report.engine}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Detailed Table Card */}
                <div className="glass-panel" style={{ padding: '24px', overflowX: 'auto' }}>
                  <h3 className="edu-card-title">Detailed Performance Breakdown</h3>
                  <table className="benchmark-table">
                    <thead>
                      <tr>
                        <th>Search Engine</th>
                        <th>Avg Latency</th>
                        <th>Min Latency</th>
                        <th>Median (P50)</th>
                        <th>P90 Latency</th>
                        <th>Tail (P99)</th>
                        <th>Max Latency</th>
                        <th>Total Runs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {benchmarkReports.map((report) => (
                        <tr key={report.engine}>
                          <td style={{ fontWeight: '700', color: '#fff' }}>
                            {engines.find(e => e.id === report.engine)?.name || report.engine}
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '600', color: 'var(--accent-primary)' }}>{report.avg} ms</td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>{report.min} ms</td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>{report.p50} ms</td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>{report.p90} ms</td>
                          <td style={{ fontFamily: 'var(--font-mono)', color: report.p99 > 100 ? 'var(--accent-danger)' : 'var(--text-secondary)' }}>{report.p99} ms</td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>{report.max} ms</td>
                          <td>{report.totalQueries}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Educational Analysis */}
                <div className="docs-layout" style={{ marginTop: '16px' }}>
                  <div className="doc-section glass-panel">
                    <h4 className="doc-title">Why Elasticsearch & indexes dominate</h4>
                    <p className="doc-desc" style={{ fontSize: '0.75rem' }}>
                      <strong>LIKE & ILIKE</strong> are forced to do <code>Seq Scans</code>, parsing every character in all rows sequentially. Because 10,000 records must be checked in memory, latency increases linearly with table size.
                      <br /><br />
                      <strong>Trigram & Full-Text Search (FTS)</strong> utilize <code>GIN Indexes</code>. They skip row-by-row scanning entirely, looking up pre-tokenized segments. This bounds query scope, delivering 10x-50x faster executions.
                      <br /><br />
                      <strong>Elasticsearch</strong> stores data directly in a Lucene Inverted Index outside our transaction database, utilizing optimized heap caches. It skips SQL compilation and lock overheads, returning relevance-sorted BM25 hits in sub-millisecond ranges.
                    </p>
                  </div>
                  <div className="doc-section glass-panel">
                    <h4 className="doc-title">Analyzing tail latency (P99)</h4>
                    <p className="doc-desc" style={{ fontSize: '0.75rem' }}>
                      Tail latency (P99) represents the worst-case query speed (slowest 1% of queries). In <strong>Postgres Full-Text Search</strong>, complex queries with multiple OR operators or common stop-words can spike P99 values due to coordinate-map scanning.
                      <br /><br />
                      In contrast, <strong>Elasticsearch</strong> mitigates tail latency spikes through query scoring caching and term filter caches, maintaining flat latencies even under stress conditions.
                    </p>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* TAB 4: How It Works */}
        {activeTab === 'docs' && (
          <div className="animate-fade-in flex flex-col gap-4">
            <div className="header-container">
              <h2 className="header-title">How Search Works</h2>
              <p className="header-desc">
                Deep dive into the database algorithms, indexing systems, and formulas of modern search technology.
              </p>
            </div>

            <div className="docs-layout">
              <div className="doc-section glass-panel">
                <h3 className="doc-title">1. SQL LIKE & ILIKE Scan</h3>
                <p className="doc-desc">
                  The SQL <code>LIKE</code> operator evaluates substring matches linearly. Because it performs a wildcard match on both sides (<code>%term%</code>), indexes are bypassed. The database engine performs a **Sequential Scan**, reading every single row from disk, making it extremely inefficient as tables scale.
                </p>
                <pre className="code-block">
                  SELECT * FROM products WHERE name LIKE &apos;%iPhone%&apos;;
                </pre>
              </div>

              <div className="doc-section glass-panel">
                <h3 className="doc-title">2. Trigram Indexing</h3>
                <p className="doc-desc">
                  A trigram splits text into 3-character subsegments (e.g. &quot;apple&quot; becomes <code>ap, app, ppl, ple</code>). By creating a <strong>GIN (Generalized Inverted Index)</strong> over these trigrams, Postgres matches tokens fuzzy-style, enabling typo tolerance and fast matching indexes.
                </p>
                <pre className="code-block">
                  CREATE INDEX trgm_idx ON products USING gin (name gin_trgm_ops);
                </pre>
              </div>

              <div className="doc-section glass-panel">
                <h3 className="doc-title">3. Postgres Full-Text Search (FTS)</h3>
                <p className="doc-desc">
                  Linguistic search tokenizes strings into normalized <strong>lexemes</strong> (e.g. &quot;running&quot; is stemmed to &quot;run&quot;, &quot;shoes&quot; to &quot;shoe&quot;) and ignores stop-words. Using <code>tsvector</code> columns indexed via GIN, Postgres runs exact linguistic matches ranked by relevance.
                </p>
                <pre className="code-block">
                  to_tsvector(&apos;english&apos;, name) @@ to_tsquery(&apos;english&apos;, &apos;shoe&apos;)
                </pre>
              </div>

              <div className="doc-section glass-panel">
                <h3 className="doc-title">4. Elasticsearch & BM25</h3>
                <p className="doc-desc">
                  Elasticsearch uses an **Inverted Index** managed by Lucene. Words are piped through customizable Analyzers and Tokenizers. It ranks search relevance using the **BM25 algorithm**, which factors in Term Frequency (TF), Inverse Document Frequency (IDF), and Document Length normalization.
                </p>
                <pre className="code-block">
                  BM25 Score = IDF(q) * ((TF * (k1 + 1)) / (TF + k1 * (1 - b + b * (L / avgL)))
                </pre>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
