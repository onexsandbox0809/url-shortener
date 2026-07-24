'use client';

import { useEffect, useState, useCallback } from 'react';

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString();
}

export default function Dashboard() {
  const [links, setLinks] = useState([]);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setErrorMsg] = useState('');

  const load = useCallback(async (mobile) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const url = mobile ? `/api/links?mobile=${encodeURIComponent(mobile)}` : '/api/links';
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load links');
      setLinks(json.links || []);
    } catch (e) {
      setErrorMsg(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    load(search.trim());
  }

  function copy(text) {
    navigator.clipboard?.writeText(text);
  }

  const totalClicks = links.reduce((sum, l) => sum + l.total_clicks, 0);

  return (
    <div className="container">
      <div className="card">
        <h1 className="title">Click Tracking Dashboard</h1>
        <p className="subtitle">
          {links.length} link{links.length === 1 ? '' : 's'} · {totalClicks} total click
          {totalClicks === 1 ? '' : 's'}
        </p>

        <form onSubmit={handleSearchSubmit} style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
          <input
            className="search-input"
            placeholder="Search by mobile number"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="btn" type="submit">Search</button>
          {search && (
            <button
              type="button"
              className="btn"
              onClick={() => {
                setSearch('');
                load();
              }}
            >
              Clear
            </button>
          )}
        </form>

        {error && <p style={{ color: '#b91c1c' }}>{error}</p>}
        {loading ? (
          <p className="muted">Loading…</p>
        ) : links.length === 0 ? (
          <p className="muted">No links yet. Create one via POST /api/create.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Mobile</th>
                <th>Short link</th>
                <th>Destination</th>
                <th>Clicks</th>
                <th>Unique</th>
                <th>Last click</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {links.map((link) => {
                const shortUrl = typeof window !== 'undefined'
                  ? `${window.location.origin}/${link.code}`
                  : `/${link.code}`;
                const isExpanded = expandedId === link.id;
                return (
                  <>
                    <tr
                      key={link.id}
                      onClick={() => setExpandedId(isExpanded ? null : link.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>{link.mobile_number || '—'}</td>
                      <td>
                        <a href={shortUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                          {shortUrl.replace(/^https?:\/\//, '')}
                        </a>
                        <button
                          className="copy-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            copy(shortUrl);
                          }}
                        >
                          copy
                        </button>
                      </td>
                      <td style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {link.long_url}
                      </td>
                      <td><span className="badge">{link.total_clicks}</span></td>
                      <td>{link.unique_ips}</td>
                      <td>{formatDate(link.last_clicked_at)}</td>
                      <td>{formatDate(link.created_at)}</td>
                    </tr>
                    {isExpanded && (
                      <tr className="row-details" key={`${link.id}-details`}>
                        <td colSpan={7}>
                          {link.clicks.length === 0 ? (
                            <span className="muted">No clicks yet.</span>
                          ) : (
                            <table>
                              <thead>
                                <tr>
                                  <th>When</th>
                                  <th>IP</th>
                                  <th>Location</th>
                                  <th>Referrer</th>
                                  <th>Device</th>
                                </tr>
                              </thead>
                              <tbody>
                                {link.clicks.map((c) => (
                                  <tr key={c.id}>
                                    <td>{formatDate(c.clicked_at)}</td>
                                    <td>{c.ip || '—'}</td>
                                    <td>{[c.city, c.country].filter(Boolean).join(', ') || '—'}</td>
                                    <td>{c.referrer || '—'}</td>
                                    <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {c.user_agent || '—'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
