import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { User } from '../../types/User';
import { fetchUsers as fetchUsersAPI, createUser as createUserAPI, updateUser as updateUserAPI, deleteUser as deleteUserAPI } from '../../api/userApi';

interface UsersState {
  users: User[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: UsersState = {
  users: [],
  status: 'idle',
  error: null,
};

export const fetchUsers = createAsyncThunk('users/fetchUsers', async () => {
  const response = await fetchUsersAPI();
  return response;
});

export const createUser = createAsyncThunk('users/createUser', async (user: Omit<User, 'id'>) => {
  const response = await createUserAPI(user);
  return response;
});

export const updateUser = createAsyncThunk('users/updateUser', async (user: User) => {
  const response = await updateUserAPI(user);
  return response;
});

export const deleteUser = createAsyncThunk('users/deleteUser', async (id: string) => {
  await deleteUserAPI(id);
  return id; // Return the ID so we can remove it from the state
});


export const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    // Example of a synchronous reducer (if needed)
    // addUser: (state, action: PayloadAction<User>) => {
    //   state.users.push(action.payload);
    // },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchUsers.fulfilled, (state, action: PayloadAction<User[]>) => {
        state.status = 'succeeded';
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to fetch users.';
      })
      .addCase(createUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.users.push(action.payload);
      })
      .addCase(createUser.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to create user.';
      })
      .addCase(updateUser.fulfilled, (state, action: PayloadAction<User>) => {
        const index = state.users.findIndex((user) => user.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to update user.';
      })
      .addCase(deleteUser.fulfilled, (state, action: PayloadAction<string>) => {
        state.users = state.users.filter((user) => user.id !== action.payload);
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to delete user.';
      });
  },
});

// export const { addUser } = usersSlice.actions; // If you have synchronous reducers
export const selectUsers = (state: { users: UsersState }) => state.users.users;
export const selectUsersStatus = (state: { users: UsersState }) => state.users.status;
export const selectUsersError = (state: { users: UsersState }) => state.users.error;

export default usersSlice.reducer;