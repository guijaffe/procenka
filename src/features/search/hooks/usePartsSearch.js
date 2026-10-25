import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { brandSelected, numberChanged, searchParts } from '../searchSlice';

export default function usePartsSearch() {
  const dispatch = useDispatch();
  const store = useStore();
  const { number, brand, brands, offers, status, error, errorCode } = useSelector((state) => state.search);
  const requestRef = useRef(null);

  const restoreSearch = useCallback(async () => {
    requestRef.current?.abort();
    requestRef.current = null;
    const params = new URLSearchParams(window.location.search);
    const urlNumber = params.get('number')?.trim() || '';
    const urlBrand = params.get('brand') || '';
    const current = store.getState().search;
    if (urlBrand && current.number === urlNumber && current.brands.some((item) => item.brand === urlBrand)) {
      dispatch(brandSelected(urlBrand));
      requestRef.current = dispatch(searchParts({ number: urlNumber, brand: urlBrand }));
      return;
    }
    if (current.number === urlNumber) dispatch(brandSelected(''));
    else dispatch(numberChanged(urlNumber));
    if (!urlNumber) return;

    const request = dispatch(searchParts({ number: urlNumber }));
    requestRef.current = request;
    const result = await request;
    if (requestRef.current !== request || !searchParts.fulfilled.match(result) || !urlBrand) return;

    if (!result.payload.some((item) => item.brand === urlBrand)) {
      const url = new URL(window.location.href);
      url.searchParams.delete('brand');
      window.history.replaceState(null, '', url);
      return;
    }
    dispatch(brandSelected(urlBrand));
    requestRef.current = dispatch(searchParts({ number: urlNumber, brand: urlBrand }));
  }, [dispatch, store]);

  useEffect(() => {
    restoreSearch();
    window.addEventListener('popstate', restoreSearch);
    return () => {
      requestRef.current?.abort();
      window.removeEventListener('popstate', restoreSearch);
    };
  }, [restoreSearch]);

  const navigate = (selectedBrand = '') => {
    const url = new URL(window.location.href);
    url.search = new URLSearchParams({
      number: number.trim(),
      ...(selectedBrand ? { brand: selectedBrand } : {}),
    });
    url.hash = '';
    if (url.href !== window.location.href) {
      const previous = new URLSearchParams(window.location.search);
      const fromBrands = Boolean(
        selectedBrand && !previous.get('brand') && previous.get('number') === number.trim(),
      );
      window.history.pushState({ fromBrands }, '', url);
    }
    restoreSearch();
  };

  return {
    number,
    brand,
    brands,
    offers,
    status,
    error,
    inputError: errorCode === 'INVALID_NUMBER' ? error : '',
    submitSearch: () => {
      if (number.trim() && status !== 'loading') navigate();
    },
    retry: ['QUOTA_EXCEEDED', 'INVALID_NUMBER'].includes(errorCode) ? undefined : restoreSearch,
    changeNumber: (value) => {
      requestRef.current?.abort();
      requestRef.current = null;
      dispatch(numberChanged(value));
    },
    selectBrand: (value) => {
      if (brand !== value) navigate(value);
    },
    backToBrands: () => {
      if (window.history.state?.fromBrands) {
        window.history.back();
        return;
      }
      const url = new URL(window.location.href);
      url.searchParams.delete('brand');
      window.history.replaceState(null, '', url);
      restoreSearch();
    },
  };
}
