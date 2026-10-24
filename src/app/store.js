import { configureStore } from '@reduxjs/toolkit';
import search from '../features/search/searchSlice';
export const store = configureStore({ reducer: { search } });
