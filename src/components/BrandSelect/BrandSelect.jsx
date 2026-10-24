import { useEffect, useRef } from 'react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Icon from '../Icon/Icon';

export default function BrandSelect({ brands, number, value, onChange, onBack }) {
  const headingRef = useRef(null);
  const interacted = useRef(false);
  const selected = brands.find((item) => item.brand === value);
  const showList = !selected;

  useEffect(() => {
    if (interacted.current) headingRef.current?.focus({ preventScroll: true });
  }, [value]);

  return (
    <section className='brand-select' aria-label='Выбор производителя'>
      {!showList && (
        <Button
          variant='text'
          className='brand-select__back'
          onClick={() => {
            interacted.current = true;
            onBack();
          }}
        >
          <Icon name='arrow-left' />К списку производителей
        </Button>
      )}
      <h3 className='brand-select__title' ref={headingRef} tabIndex={-1}>
        {showList ? 'Выберите производителя' : 'Выбранная деталь'}
        {showList && <Badge>{brands.length}</Badge>}
      </h3>
      {showList ? (
        <>
          <p className='brand-select__hint'>
            Одинаковый артикул может относиться к разным деталям. Сверьте название.
          </p>
          <ul className='brand-select__list'>
            {brands.map((item) => (
              <li key={item.brand} className='brand-select__item'>
                <button
                  type='button'
                  className='brand-select__option'
                  onClick={() => {
                    interacted.current = true;
                    onChange(item.brand);
                  }}
                >
                  <span className='brand-select__identity'>
                    <span className='brand-select__name'>{item.brand}</span>
                    <span className='brand-select__number'>Артикул: {number}</span>
                  </span>
                  <span className='brand-select__description'>
                    {item.names.join(' · ') || 'Название не указано'}
                  </span>
                  <span className='brand-select__action'>
                    Цена и аналоги <Icon name='arrow-right' />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div>
          <strong className='brand-select__name'>
            {selected.brand} · {number}
          </strong>
          <p className='brand-select__description'>{selected.names.join(' · ') || 'Название не указано'}</p>
        </div>
      )}
    </section>
  );
}
