export default function SectionHeader({ id, step, title, description, children }) {
  return (
    <div className='section-header'>
      {step && (
        <span className='section-header__step' aria-hidden='true'>
          {step}
        </span>
      )}
      <div className='section-header__content'>
        <h2 id={id} className='section-header__title'>
          {title}
        </h2>
        {description && <p className='section-header__description'>{description}</p>}
      </div>
      {children && <div className='section-header__aside'>{children}</div>}
    </div>
  );
}
