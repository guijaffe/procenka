import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { fetchParts, getOffers } from '../../api/parts';

export const searchParts = createAsyncThunk('search/fetch', (params, { signal }) =>
  fetchParts(params, signal),
);
const initialState = {
  number: '',
  brand: '',
  brands: [],
  offers: [],
  status: 'idle',
  error: '',
  errorCode: '',
  requestId: null,
};
const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    numberChanged: (_, { payload }) => ({ ...initialState, number: payload }),
    brandSelected: (state, { payload }) => {
      state.brand = payload;
      state.offers = [];
      state.error = '';
      state.errorCode = '';
      state.status = 'idle';
      state.requestId = null;
    },
  },
  extraReducers: (builder) =>
    builder
      .addCase(searchParts.pending, (state, action) => {
        state.status = 'loading';
        state.error = '';
        state.errorCode = '';
        state.requestId = action.meta.requestId;
      })
      .addCase(searchParts.fulfilled, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.status = 'success';
        if (action.meta.arg.brand) state.offers = getOffers(action.payload);
        else {
          const brands = new Map();
          for (const item of action.payload) {
            if (!brands.has(item.brand)) brands.set(item.brand, { brand: item.brand, names: [] });
            const names = brands.get(item.brand).names;
            if (item.name && !names.includes(item.name)) names.push(item.name);
          }
          state.brands = [...brands.values()].sort((a, b) => a.brand.localeCompare(b.brand));
        }
      })
      .addCase(searchParts.rejected, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.status = action.meta.aborted ? 'idle' : 'error';
        state.error = action.meta.aborted ? '' : action.error.message;
        state.errorCode = action.meta.aborted ? '' : action.error.code || '';
      }),
});
export const { numberChanged, brandSelected } = searchSlice.actions;
export default searchSlice.reducer;
