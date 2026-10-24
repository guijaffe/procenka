import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Icon from '../Icon/Icon';
import { useEffect, useMemo, useRef, useState } from 'react';
import PartCard from '../PartCard/PartCard';
import { groupOffers } from '../../features/search/groupOffers';

const PAGE_SIZE = 20;

export default function SearchResults({ offers }) {
  const products = useMemo(() => groupOffers(offers), [offers]);
  const originals = products.filter((product) => product.isOriginal);
  const analogues = products.filter((product) => !product.isOriginal);
  const [page, setPage] = useState(1);
  const headingRef = useRef(null);
  const pageCount = Math.ceil(analogues.length / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE;
  const shouldFocusHeading = useRef(false);
  useEffect(() => {
    if (!shouldFocusHeading.current) return;
    headingRef.current?.focus({ preventScroll: true });
    headingRef.current?.scrollIntoView({ block: 'start' });
    shouldFocusHeading.current = false;
  }, [page]);
  const changePage = (next) => {
    if (next === page) return;
    shouldFocusHeading.current = true;
    setPage(next);
  };
  return (
    <>
      <section aria-labelledby='originals-title' className='results-section results-section_original'>
        <h3 className='results-section__title' id='originals-title'>
          Искомая деталь <Badge>{originals.length}</Badge>
        </h3>
        <p className='results-section__help'>
          Выбранный производитель и артикул. Раскройте деталь, чтобы сравнить склады.
        </p>
        {originals.map((product) => (
          <PartCard key={product.productId} product={product} />
        ))}
      </section>
      <section aria-labelledby='analogues-title' className='results-section'>
        <h3 className='results-section__title' ref={headingRef} tabIndex={-1} id='analogues-title'>
          Аналоги <Badge>{analogues.length}</Badge>
        </h3>
        <p className='results-section__help'>
          По убыванию суммарного остатка на складах. Позиции без подтверждённого наличия — в конце.
        </p>
        {!analogues.length ? (
          <p>Сервис не вернул аналогов.</p>
        ) : (
          <>
            <p className='results-section__range' role='status'>
              Детали {start + 1}–{Math.min(start + PAGE_SIZE, analogues.length)} из {analogues.length}
            </p>
            {analogues.slice(start, start + PAGE_SIZE).map((product) => (
              <PartCard key={product.productId} product={product} />
            ))}
          </>
        )}
        {pageCount > 1 && (
          <nav className='results-pagination' aria-label='Страницы аналогов'>
            <Button variant='secondary' disabled={page === 1} onClick={() => changePage(page - 1)}>
              <Icon name='arrow-left' /> Назад
            </Button>
            <label className='results-pagination__label'>
              Страница{' '}
              <select
                className='form-select results-pagination__select'
                value={page}
                onChange={(event) => changePage(Number(event.target.value))}
              >
                {Array.from({ length: pageCount }, (_, index) => (
                  <option key={index} value={index + 1}>
                    {index + 1}
                  </option>
                ))}
              </select>{' '}
              из {pageCount}
            </label>
            <Button variant='secondary' disabled={page === pageCount} onClick={() => changePage(page + 1)}>
              Далее <Icon name='arrow-right' />
            </Button>
          </nav>
        )}
      </section>
    </>
  );
}
