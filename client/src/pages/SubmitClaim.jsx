import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Icon from '../components/Icon';

const STEPS = ['Trip Details', 'Expense Items', 'Review & Submit'];

export default function SubmitClaim() {
  const navigate = useNavigate();
  const [step, setStep]       = useState(0);
  const [categories, setCats] = useState([]);
  const [submitting, setSub]  = useState(false);
  const [error, setError]     = useState('');

  const [trip, setTrip] = useState({
    title: '', destination: '', trip_start: '', trip_end: '', purpose: '',
  });
  const [items, setItems] = useState([{ category_id: '', description: '', amount: '' }]);

  useEffect(() => {
    api.get('/categories').then(({ data }) => setCats(data.categories));
  }, []);

  const catMap = Object.fromEntries(categories.map(c => [c.id, c]));
  const totalAmount = items.reduce((s, i) => s + parseFloat(i.amount || 0), 0);
  const policyViolations = items.filter(item => {
    const cat = catMap[item.category_id];
    return cat && parseFloat(item.amount || 0) > parseFloat(cat.limit_amount);
  });

  const addItem    = () => setItems(p => [...p, { category_id: '', description: '', amount: '' }]);
  const removeItem = (i) => setItems(p => p.filter((_, idx) => idx !== i));
  const updateItem = (i, field, val) => setItems(p => p.map((item, idx) => idx === i ? { ...item, [field]: val } : item));

  const validateStep = () => {
    if (step === 0) return trip.title && trip.destination && trip.trip_start && trip.trip_end;
    if (step === 1) return items.every(i => i.category_id && i.amount && parseFloat(i.amount) > 0);
    return true;
  };

  const handleSubmit = async () => {
    setSub(true); setError('');
    try {
      await api.post('/claims', {
        ...trip,
        items: items.map(i => ({ ...i, category_id: parseInt(i.category_id), amount: parseFloat(i.amount) })),
      });
      navigate('/my-claims');
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed. Please try again.');
      setSub(false);
    }
  };

  const Stepper = () => (
    <div className="stepper">
      {STEPS.map((label, i) => (
        <div key={label} className="step-item">
          <div className="step-content-wrap">
            <div className={`step-circle ${i < step ? 'done' : i === step ? 'active' : ''}`}>
              {i < step ? <Icon name="check" size={14} /> : i + 1}
            </div>
            <div className={`step-label ${i === step ? 'active' : ''}`}>{label}</div>
          </div>
          {i < STEPS.length - 1 && <div className={`step-connector ${i < step ? 'done' : ''}`} />}
        </div>
      ))}
    </div>
  );

  const fmtAmt = (n) => `PKR ${parseFloat(n).toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Submit Expense Claim</h1>
          <p>Fill in your trip details and itemised expenses below.</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 780 }}>
        <Stepper />

        {/* Step 0: Trip Details */}
        {step === 0 && (
          <div>
            <div className="form-group">
              <label className="form-label">Trip Title <span className="required">*</span></label>
              <input className="form-control" placeholder="e.g. Sales Conference — Dubai 2026"
                value={trip.title} onChange={e => setTrip(t => ({ ...t, title: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Destination <span className="required">*</span></label>
              <input className="form-control" placeholder="e.g. Dubai, UAE"
                value={trip.destination} onChange={e => setTrip(t => ({ ...t, destination: e.target.value }))} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Start Date <span className="required">*</span></label>
                <input className="form-control" type="date"
                  value={trip.trip_start} onChange={e => setTrip(t => ({ ...t, trip_start: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">End Date <span className="required">*</span></label>
                <input className="form-control" type="date" min={trip.trip_start}
                  value={trip.trip_end} onChange={e => setTrip(t => ({ ...t, trip_end: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Business Purpose</label>
              <textarea className="form-control" placeholder="Brief description of the business purpose of this trip…"
                value={trip.purpose} onChange={e => setTrip(t => ({ ...t, purpose: e.target.value }))} />
            </div>
          </div>
        )}

        {/* Step 1: Expense Items */}
        {step === 1 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div className="card-title">Expense Items</div>
                <div className="card-subtitle">Add each expense with its category and amount.</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)', marginBottom: 4 }}>Total</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent)', letterSpacing: '-0.02em' }}>
                  {fmtAmt(totalAmount)}
                </div>
              </div>
            </div>

            {policyViolations.length > 0 && (
              <div className="alert alert-warning" style={{ marginBottom: 14 }}>
                <Icon name="alert-circle" size={15} />
                {policyViolations.length} item(s) exceed the category policy limit. You may still submit, but they will be flagged for review.
              </div>
            )}

            {items.map((item, i) => {
              const cat = catMap[item.category_id];
              const over = cat && parseFloat(item.amount || 0) > parseFloat(cat.limit_amount);
              return (
                <div key={i} className="expense-item-row" style={{ borderColor: over ? 'rgba(239,69,96,0.35)' : undefined }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Category <span className="required">*</span></label>
                    <select className="form-control" value={item.category_id}
                      onChange={e => updateItem(i, 'category_id', e.target.value)}>
                      <option value="">Select category…</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} — limit PKR {parseFloat(c.limit_amount).toLocaleString()}
                        </option>
                      ))}
                    </select>
                    {over && <div className="form-error">Exceeds policy limit of PKR {parseFloat(cat.limit_amount).toLocaleString()}</div>}
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Description</label>
                    <input className="form-control" placeholder="Brief description"
                      value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Amount (PKR) <span className="required">*</span></label>
                    <input className="form-control" type="number" min="0" step="0.01" placeholder="0.00"
                      value={item.amount} onChange={e => updateItem(i, 'amount', e.target.value)} />
                  </div>
                  <button className="remove-item-btn" onClick={() => removeItem(i)}
                    disabled={items.length === 1} title="Remove item">
                    <Icon name="x" size={15} />
                  </button>
                </div>
              );
            })}

            <button className="btn btn-secondary btn-sm" onClick={addItem} style={{ marginTop: 6 }}>
              <Icon name="plus" size={14} /> Add Item
            </button>
          </div>
        )}

        {/* Step 2: Review */}
        {step === 2 && (
          <div>
            <div className="card-title" style={{ marginBottom: 16 }}>Review Your Submission</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[['Trip', trip.title], ['Destination', trip.destination], ['Start Date', trip.trip_start], ['End Date', trip.trip_end]].map(([lbl, val]) => (
                <div key={lbl} className="detail-field">
                  <label>{lbl}</label>
                  <p>{val || '—'}</p>
                </div>
              ))}
              {trip.purpose && (
                <div className="detail-field" style={{ gridColumn: '1/-1' }}>
                  <label>Business Purpose</label>
                  <p>{trip.purpose}</p>
                </div>
              )}
            </div>

            <hr className="divider" />

            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr><th>Category</th><th>Description</th><th>Amount (PKR)</th><th>Policy</th></tr>
                </thead>
                <tbody>
                  {items.map((item, i) => {
                    const cat = catMap[item.category_id];
                    const over = cat && parseFloat(item.amount) > parseFloat(cat.limit_amount);
                    return (
                      <tr key={i}>
                        <td className="td-main">{cat?.name || '—'}</td>
                        <td>{item.description || '—'}</td>
                        <td className="td-amount">{fmtAmt(item.amount)}</td>
                        <td>
                          {over
                            ? <span className="badge badge-rejected">Over Limit</span>
                            : <span className="badge badge-approved">Within Limit</span>}
                        </td>
                      </tr>
                    );
                  })}
                  <tr>
                    <td colSpan={2} style={{ fontWeight: 700, color: 'var(--text-1)' }}>Total</td>
                    <td className="td-amount" style={{ fontSize: 15 }}>{fmtAmt(totalAmount)}</td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>

            {error && <div className="alert alert-danger" style={{ marginTop: 14 }}><Icon name="alert-circle" size={15} />{error}</div>}
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-secondary" onClick={() => setStep(s => s - 1)} disabled={step === 0}>
            <Icon name="chevron-left" size={15} /> Back
          </button>
          {step < 2 ? (
            <button className="btn btn-primary" onClick={() => setStep(s => s + 1)} disabled={!validateStep()}>
              Continue <Icon name="chevron-right" size={15} />
            </button>
          ) : (
            <button className="btn btn-success" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting…' : <><Icon name="send" size={14} /> Submit Claim</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
