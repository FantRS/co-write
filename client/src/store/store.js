import { configureStore } from "@reduxjs/toolkit";
import themeReducer from "./slices/themeSlice.js";
import collabReducer from "./slices/collabSlice.js";
import authReducer from "./slices/authSlice.js";

export const store = configureStore({
    reducer: {
        theme: themeReducer,
        collab: collabReducer,
        auth: authReducer,
    },
    // Production performance optimization: disabling devTools check serialization errors on Automerge documents
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
        }),
});
