import sprite from '../../assets/icons/bootstrap.svg?no-inline';

export default function Icon({ name, className = '' }) {
  return (
    <svg
      className={`icon ${className}`.trim()}
      width='16'
      height='16'
      fill='currentColor'
      aria-hidden='true'
      focusable='false'
    >
      <use href={`${sprite}#${name}`} />
    </svg>
  );
}
