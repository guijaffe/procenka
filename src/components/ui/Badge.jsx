export default function Badge({ tone = 'neutral', children }) {
  return <span className={`ui-badge ui-badge_${tone}`}>{children}</span>;
}
