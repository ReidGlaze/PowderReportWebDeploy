import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FavoritesState {
  favorites: number[];
  addFavorite: (resortId: number) => void;
  removeFavorite: (resortId: number) => void;
  isFavorite: (resortId: number) => boolean;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      addFavorite: (resortId) => 
        set((state) => ({
          favorites: [...state.favorites, resortId]
        })),
      removeFavorite: (resortId) =>
        set((state) => ({
          favorites: state.favorites.filter(id => id !== resortId)
        })),
      isFavorite: (resortId) =>
        get().favorites.includes(resortId),
    }),
    {
      name: 'favorites-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
); 