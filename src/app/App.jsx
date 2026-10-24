import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import SectionHeader from '../components/ui/SectionHeader';
import BrandSelect from '../components/BrandSelect/BrandSelect';
import Icon from '../components/Icon/Icon';
import usePartsSearch from '../features/search/hooks/usePartsSearch';
import StatusMessage from '../components/StatusMessage/StatusMessage';
import SearchResults from '../components/SearchResults/SearchResults';

export default function App() {
  const { number, brand, brands, offers, status, error, retry, submitSearch, changeNumber, selectBrand, backToBrands } =
    usePartsSearch();
  const warehouseCount = offers.filter((offer) => offer.hasWarehouse).length;
  return (
    <>
      <a className='skip-link' href='#search'>
        Перейти к поиску
      </a>
      <header className='site-header'>
        <div className='page-container site-header__inner'>
          <a href='/' className='site-logo' aria-label='Проценка — главная'>
            <img className='site-logo__mark' src='/favicon.svg' width='36' height='36' alt='' />
            Проценка<span className='site-logo__dot'>.</span>
          </a>
          <span className='site-header__label'>Поиск автозапчастей</span>
        </div>
      </header>
      <main className='page-container search-page' id='search' tabIndex={-1}>
        <div className='search-intro'>
          <p className='search-intro__eyebrow'>ТОЧНЫЙ ПОИСК. БОЛЬШЕ ВОЗМОЖНОСТЕЙ.</p>
          <h1 className='search-intro__title'>
            Нужная деталь.
            <br />
            <span className='search-intro__accent'>Подходящее предложение.</span>
          </h1>
          <p className='search-intro__description'>
            Введите артикул, выберите производителя и сравните
            <br className='search-intro__break' /> цены и наличие оригинальной детали и аналогов.
          </p>
        </div>
        <div className='search-workspace'>
          <section className='search-panel' aria-labelledby='search-title'>
            <SectionHeader
              id='search-title'
              step='01'
              title='Поиск детали'
              description='Укажите артикул с детали или упаковки.'
            />
            <form
              role='search'
              aria-label='Поиск по артикулу'
              onSubmit={(event) => {
                event.preventDefault();
                submitSearch();
              }}
            >
              <label htmlFor='part-number' className='form-label search-form__label'>
                Артикул детали
              </label>
              <div className='search-form__controls'>
                <input
                  id='part-number'
                  className='form-control form-control-lg search-form__input'
                  value={number}
                  onChange={(event) => changeNumber(event.target.value)}
                  placeholder='Например, 01089'
                  autoComplete='off'
                  spellCheck={false}
                  maxLength={100}
                  aria-describedby='search-help'
                />
                <Button
                  type='submit'
                  disabled={!number.trim() || status === 'loading'}
                >
                  <Icon name='search' />
                  Найти
                </Button>
              </div>
              <p id='search-help' className='search-form__help'>
                Введите артикул и нажмите «Найти» или Enter.
              </p>
            </form>
            {!brand && status === 'loading' && <StatusMessage loading>Ищем производителей…</StatusMessage>}
            {!brand && error && <StatusMessage error={error} onRetry={retry} />}
            {!brand && status === 'success' && !brands.length && (
              <StatusMessage>Производители не найдены. Проверьте артикул и попробуйте ещё раз.</StatusMessage>
            )}
            {!brand && status === 'success' && brands.length > 0 && (
              <p className='visually-hidden' role='status'>
                Найдено производителей: {brands.length}. Выберите производителя.
              </p>
            )}
            {brands.length > 0 && <BrandSelect key={number} brands={brands} number={number.trim()} value={brand} onChange={selectBrand} onBack={backToBrands} />}
          </section>
          {brand && (
            <section
              className='search-panel search-panel_results'
              aria-labelledby='offers-title'
              aria-busy={status === 'loading'}
            >
              <SectionHeader
                id='offers-title'
                step='02'
                title='Предложения и аналоги'
                description={`${brand} · ${number.trim()}`}
              >
                {status === 'success' && <Badge>{warehouseCount} предложений складов</Badge>}
              </SectionHeader>
              {status === 'loading' && (
                <StatusMessage loading>Загружаем предложения и аналоги…</StatusMessage>
              )}
              {error && <StatusMessage error={error} onRetry={retry} />}
              {status === 'success' && (
                <>
                  {offers.length > 0 && (
                    <p className='visually-hidden' role='status'>
                      Найдено складских предложений: {warehouseCount}
                    </p>
                  )}
                  {offers.length ? (
                    <SearchResults key={`${number}-${brand}`} offers={offers} />
                  ) : (
                    <StatusMessage>
                      Для этой детали и её аналогов складских предложений нет. Выберите другого производителя.
                    </StatusMessage>
                  )}
                </>
              )}
            </section>
          )}
        </div>
        <p className='search-page__note'>
          Цена и остаток указаны для конкретного склада. Наличие может измениться.
        </p>
      </main>
      <footer className='page-container site-footer'>
        <span className='site-footer__brand'>Проценка.</span>
      </footer>
    </>
  );
}
