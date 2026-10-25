import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { fetchParts, getBrands, getOffers } from '../../api/parts';

export const searchParts = createAsyncThunk('search/fetch', (params, { signal }) => {
  if (!/[\p{L}\p{N}]/u.test(params.number)) {
    const error = new Error('Введите артикул, содержащий хотя бы одну букву или цифру.');
    error.code = 'INVALID_NUMBER';
    throw error;
  }
  return fetchParts(params, signal);
});
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
        else state.brands = getBrands(action.payload);
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
