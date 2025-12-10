```typescript
import { create } from 'zustand';

interface AppState {
  isLoggedIn: boolean;
  login: () => void;
  logout: () => void;
}

const useStore = create<AppState>((set) => ({
  isLoggedIn: false,
  login: () => set({ isLoggedIn: true }),
  logout: () => set({ isLoggedIn: false }),
}));

export default useStore;
```