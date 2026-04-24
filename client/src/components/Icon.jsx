/**
 * Icon — stroke-based SVG icon library (Lucide-style)
 * Usage: <Icon name="home" size={18} />
 */
export default function Icon({ name, size = 18, className = '', style = {} }) {
  const p = { strokeWidth: '1.75', strokeLinecap: 'round', strokeLinejoin: 'round' };

  const icons = {
    home: <><path {...p} d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z" /><path {...p} d="M9 21V12h6v9" /></>,
    plus: <><path {...p} d="M12 5v14M5 12h14" /></>,
    list: <><path {...p} d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" /></>,
    'check-circle': <><path {...p} d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path {...p} d="M22 4L12 14.01l-3-3" /></>,
    'x-circle': <><circle {...p} cx="12" cy="12" r="10" /><path {...p} d="M15 9l-6 6M9 9l6 6" /></>,
    clock: <><circle {...p} cx="12" cy="12" r="10" /><path {...p} d="M12 6v6l4 2" /></>,
    eye: <><path {...p} d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle {...p} cx="12" cy="12" r="3" /></>,
    users: <><path {...p} d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle {...p} cx="9" cy="7" r="4" /><path {...p} d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    'bar-chart': <><path {...p} d="M18 20V10M12 20V4M6 20v-6" /></>,
    shield: <><path {...p} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></>,
    message: <><path {...p} d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></>,
    'log-out': <><path {...p} d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></>,
    search: <><circle {...p} cx="11" cy="11" r="8" /><path {...p} d="M21 21l-4.35-4.35" /></>,
    filter: <><path {...p} d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" /></>,
    send: <><path {...p} d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></>,
    trash: <><path {...p} d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></>,
    calendar: <><rect {...p} x="3" y="4" width="18" height="18" rx="2" /><path {...p} d="M16 2v4M8 2v4M3 10h18" /></>,
    'map-pin': <><path {...p} d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle {...p} cx="12" cy="10" r="3" /></>,
    'arrow-left': <><path {...p} d="M19 12H5M12 19l-7-7 7-7" /></>,
    briefcase: <><rect {...p} x="2" y="7" width="20" height="14" rx="2" /><path {...p} d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></>,
    'credit-card': <><rect {...p} x="1" y="4" width="22" height="16" rx="2" /><path {...p} d="M1 10h22" /></>,
    'alert-circle': <><circle {...p} cx="12" cy="12" r="10" /><path {...p} d="M12 8v4M12 16h.01" /></>,
    check: <><path {...p} d="M20 6L9 17l-5-5" /></>,
    'chevron-left': <><path {...p} d="M15 18l-6-6 6-6" /></>,
    'chevron-right': <><path {...p} d="M9 18l6-6-6-6" /></>,
    user: <><path {...p} d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle {...p} cx="12" cy="7" r="4" /></>,
    plane: <><path {...p} d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1 0-3 .5-4.5 2L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" /></>,
    'file-text': <><path {...p} d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path {...p} d="M14 2v6h6M16 13H8M16 17H8M10 9H8" /></>,
    'refresh-cw': <><path {...p} d="M23 4v6h-6M1 20v-6h6" /><path {...p} d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></>,
    'trending-up': <><path {...p} d="M23 6l-9.5 9.5-5-5L1 18" /><path {...p} d="M17 6h6v6" /></>,
    'dollar-sign': <><path {...p} d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>,
    info: <><circle {...p} cx="12" cy="12" r="10" /><path {...p} d="M12 16v-4M12 8h.01" /></>,
    'x': <><path {...p} d="M18 6L6 18M6 6l12 12" /></>,
    'layers': <><path {...p} d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></>,
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      style={style}
      className={className}
      aria-hidden="true"
    >
      {icons[name] ?? null}
    </svg>
  );
}
