import { create } from 'zustand';

const useDialogStore = create((set) => ({
    alertConfig: null,
    confirmConfig: null,

    closeAlert: () => set((state) => {
        if (state.alertConfig) state.alertConfig.resolve();
        return { alertConfig: null };
    }),

    closeConfirm: (result) => set((state) => {
        if (state.confirmConfig) state.confirmConfig.resolve(result);
        return { confirmConfig: null };
    })
}));

export const showAlert = (message) => {
    return new Promise((resolve) => {
        useDialogStore.setState({ alertConfig: { message, resolve } });
    });
};

export const showConfirm = (message) => {
    return new Promise((resolve) => {
        useDialogStore.setState({ confirmConfig: { message, resolve } });
    });
};

export default useDialogStore;
