import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAnnouncements } from '../../modules/announcements/useAnnouncements';
import type { Announcement } from '../../data/store';

// ─────────────────────────────────────────────────────────────────────────────
// Priority badge
// ─────────────────────────────────────────────────────────────────────────────
const PRIORITY_STYLES: Record<string, { bg: string; text: string }> = {
  High: { bg: '#FFF0F0', text: '#E53E3E' },
  Medium: { bg: '#FFF8E6', text: '#B7791F' },
  Low: { bg: '#F0FFF4', text: '#276749' },
};

function PriorityBadge({ level }: { level: string }) {
  const style = PRIORITY_STYLES[level] ?? { bg: '#F0F4FF', text: '#4a5568' };
  return (
    <span
      style={{
        background: style.bg,
        color: style.text,
        fontSize: '0.72rem',
        fontWeight: 700,
        padding: '3px 12px',
        borderRadius: '20px',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {level}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function initials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(raw: string | Date): string {
  try {
    return new Date(raw).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return String(raw);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Search icon
// ─────────────────────────────────────────────────────────────────────────────
function SearchIcon() {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton loader — shown while data is loading
// ─────────────────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div
      style={{
        background: '#fff',
        border: '1.5px solid #e8ecf4',
        borderRadius: '14px',
        padding: '22px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -600px 0; }
          100% { background-position: 600px 0; }
        }
        .skel {
          background: linear-gradient(90deg, #f0f4ff 25%, #e2e8f5 50%, #f0f4ff 75%);
          background-size: 600px 100%;
          animation: shimmer 1.4s infinite linear;
          border-radius: 6px;
        }
      `}</style>
      <div className="skel" style={{ height: 18, width: '55%' }} />
      <div className="skel" style={{ height: 14, width: '90%' }} />
      <div className="skel" style={{ height: 14, width: '75%' }} />
      <div className="skel" style={{ height: 12, width: '30%', marginTop: 4 }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Single Announcement Card
// ─────────────────────────────────────────────────────────────────────────────
function AnnouncementCard({ announcement }: { announcement: Announcement }) {
  const [hovered, setHovered] = useState(false);

  const authorName = announcement.createdBy ?? 'Unknown';

  const displayDate = formatDate(announcement.createdAt ?? '');

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered
          ? 'linear-gradient(to right, #0B0E92, #69A6F0)'
          : '#ffffff',
        borderRadius: '14px',
        border: hovered ? '1.5px solid transparent' : '1.5px solid #e8ecf4',
        padding: '22px 24px',
        cursor: 'pointer',
        transition: 'all 0.28s cubic-bezier(.4,0,.2,1)',
        boxShadow: hovered
          ? '0 8px 32px rgba(11,14,146,0.18)'
          : '0 1px 6px rgba(30,40,100,0.06)',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Shimmer accent line on hover */}
      {hovered && (
        <div
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            height: '3px',
            background: 'rgba(255,255,255,0.35)',
            borderRadius: '14px 14px 0 0',
          }}
        />
      )}

      {/* Title + priority */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '10px',
          flexWrap: 'wrap',
        }}
      >
        <h3
          style={{
            fontSize: '1.02rem',
            fontWeight: 700,
            color: hovered ? '#ffffff' : '#1a2340',
            lineHeight: 1.35,
            transition: 'color 0.25s',
            flex: 1,
            minWidth: 0,
          }}
        >
          {announcement.title}
        </h3>
        {announcement.priority && (
          <PriorityBadge level={announcement.priority} />
        )}
      </div>

      {/* Body / message */}
      <p
        style={{
          fontSize: '0.875rem',
          color: hovered ? 'rgba(255,255,255,0.88)' : '#4a5568',
          lineHeight: 1.65,
          marginBottom: '14px',
          transition: 'color 0.25s',
        }}
      >
        {announcement.content ?? ''}
      </p>

      {/* Footer: author + date */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.78rem',
          color: hovered ? 'rgba(255,255,255,0.65)' : '#a0aec0',
          transition: 'color 0.25s',
        }}
      >
        <span
          style={{
            width: 22, height: 22,
            borderRadius: '50%',
            background: hovered ? 'rgba(255,255,255,0.2)' : '#e8ecf4',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.6rem',
            fontWeight: 700,
            color: hovered ? '#fff' : '#0B0E92',
            transition: 'all 0.25s',
            flexShrink: 0,
          }}
        >
          {initials(authorName)}
        </span>
        By {authorName} · {displayDate}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page — fully dynamic
// ─────────────────────────────────────────────────────────────────────────────
export default function MyAnnouncements() {
  const { user } = useAuth();

  // useAnnouncements drives everything: data, search state
  const {
    filtered,
    search,
    setSearch,
  } = useAnnouncements(user?.department);

  const loading = false;
  const error = null;

  return (
    <div
      style={{
        fontFamily: "'Plus Jakarta Sans', 'Segoe UI', sans-serif",
        minHeight: '100vh',
        background: '#f5f7fc',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        input:focus { outline: none; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Mobile ── */
        @media (max-width: 640px) {
          .ann-inner   { padding: 20px 16px 48px !important; }
          .ann-topbar  { flex-direction: column !important; align-items: flex-start !important; }
          .ann-search  { max-width: 100% !important; }
        }
      `}</style>

      <div
        className="ann-inner"
        style={{ maxWidth: 860, margin: '0 auto', padding: '36px 24px 60px' }}
      >

        {/* ── Header ── */}
        <div
          className="ann-topbar"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            marginBottom: 24,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 'clamp(1.3rem, 4vw, 1.75rem)',
                fontWeight: 800,
                color: '#1a2340',
                letterSpacing: '-0.4px',
                lineHeight: 1.2,
              }}
            >
              Announcements
            </h1>
            <p style={{ fontSize: '0.82rem', color: '#a0aec0', marginTop: 4 }}>
              Company and department updates
            </p>
          </div>

          {/* Live count badge */}
          {!loading && !error && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                background: 'linear-gradient(to right, #0B0E92, #69A6F0)',
                color: '#fff',
                padding: '7px 16px',
                borderRadius: 30,
                fontSize: '0.78rem',
                fontWeight: 600,
                boxShadow: '0 4px 14px rgba(11,14,146,0.25)',
              }}
            >
              📢 {filtered.length} announcement{filtered.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* ── Search ── */}
        <div
          className="ann-search"
          style={{ position: 'relative', maxWidth: 360, marginBottom: 24, width: '100%' }}
        >
          <span
            style={{
              position: 'absolute', left: 14, top: '50%',
              transform: 'translateY(-50%)',
              color: '#a0aec0',
              display: 'flex', alignItems: 'center',
              pointerEvents: 'none',
            }}
          >
            <SearchIcon />
          </span>
          <input
            type="text"
            placeholder="Search announcements…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '11px 16px 11px 40px',
              background: '#fff',
              border: '1.5px solid #e8ecf4',
              borderRadius: 30,
              fontSize: '0.85rem',
              color: '#1a2340',
              fontFamily: 'inherit',
              boxShadow: '0 1px 6px rgba(30,40,100,0.06)',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = '#69A6F0';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(105,166,240,0.18)';
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = '#e8ecf4';
              e.currentTarget.style.boxShadow = '0 1px 6px rgba(30,40,100,0.06)';
            }}
          />
        </div>

        {/* ── Loading skeletons ── */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[1, 2, 3].map(n => <SkeletonCard key={n} />)}
          </div>
        )}

        {/* ── Error state ── */}
        {!loading && error && (
          <div
            style={{
              textAlign: 'center',
              padding: '56px 24px',
              background: '#fff',
              borderRadius: 16,
              border: '1.5px solid #fee2e2',
            }}
          >
            <div style={{ fontSize: '2.2rem', marginBottom: 10 }}>⚠️</div>
            <div style={{ fontWeight: 700, color: '#dc2626', fontSize: '0.95rem', marginBottom: 6 }}>
              Failed to load announcements
            </div>
            <div style={{ color: '#a0aec0', fontSize: '0.8rem' }}>
              {typeof error === 'string' ? error : 'Please try refreshing the page.'}
            </div>
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && !error && filtered.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '64px 24px',
              background: '#fff',
              borderRadius: 16,
              border: '1.5px solid #e8ecf4',
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📢</div>
            <div style={{ fontWeight: 700, color: '#1a2340', fontSize: '1rem', marginBottom: 6 }}>
              {search ? 'No results found' : 'No announcements yet'}
            </div>
            <div style={{ color: '#a0aec0', fontSize: '0.82rem' }}>
              {search
                ? `No announcements match "${search}". Try a different term.`
                : 'Check back later for updates from your team.'}
            </div>
          </div>
        )}

        {/* ── Announcement cards ── */}
        {!loading && !error && filtered.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filtered.map((announcement, i) => (
              <div
                key={announcement.id}
                style={{
                  animation: 'fadeUp 0.4s ease both',
                  animationDelay: `${i * 0.06}s`,
                }}
              >
                <AnnouncementCard announcement={announcement} />
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}