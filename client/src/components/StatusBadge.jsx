const STATUS_MAP = {
  submitted:    { label: 'Submitted',    cls: 'badge-submitted'    },
  under_review: { label: 'Under Review', cls: 'badge-under_review' },
  approved:     { label: 'Approved',     cls: 'badge-approved'     },
  rejected:     { label: 'Rejected',     cls: 'badge-rejected'     },
  reimbursed:   { label: 'Reimbursed',   cls: 'badge-reimbursed'   },
};

export default function StatusBadge({ status }) {
  const meta = STATUS_MAP[status] || { label: status, cls: '' };
  return (
    <span className={`badge ${meta.cls}`}>
      {meta.label}
    </span>
  );
}
