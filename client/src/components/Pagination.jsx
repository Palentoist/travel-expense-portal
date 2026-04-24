import Icon from './Icon';

export default function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.totalPages <= 1) return null;
  const { page, totalPages, total, limit } = pagination;
  const start = (page - 1) * limit + 1;
  const end   = Math.min(page * limit, total);

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) pages.push(i);
    else if (pages[pages.length - 1] !== '…') pages.push('…');
  }

  return (
    <div className="pagination">
      <span className="pagination-info">Showing {start}–{end} of {total}</span>
      <div className="pagination-controls">
        <button className="page-btn" onClick={() => onPageChange(page - 1)} disabled={page === 1}>
          <Icon name="chevron-left" size={14} />
        </button>
        {pages.map((p, i) =>
          p === '…'
            ? <span key={`e-${i}`} className="page-btn" style={{ cursor: 'default', opacity: 0.5 }}>…</span>
            : <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => onPageChange(p)}>{p}</button>
        )}
        <button className="page-btn" onClick={() => onPageChange(page + 1)} disabled={page === totalPages}>
          <Icon name="chevron-right" size={14} />
        </button>
      </div>
    </div>
  );
}
