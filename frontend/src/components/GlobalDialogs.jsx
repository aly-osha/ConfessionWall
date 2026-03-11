import React from 'react';
import useDialogStore from '../store/dialogStore';

const GlobalDialogs = () => {
    const { alertConfig, confirmConfig, closeAlert, closeConfirm } = useDialogStore();

    if (!alertConfig && !confirmConfig) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999,
            backdropFilter: 'blur(3px)'
        }}>
            {/* Alert Box */}
            {alertConfig && (
                <div className="card" style={{ width: '90%', maxWidth: '400px', margin: 0, textAlign: 'center' }}>
                    <h3 style={{ marginBottom: '15px' }}>Notice</h3>
                    <p style={{ marginBottom: '25px', fontSize: '1.05rem' }}>{alertConfig.message}</p>
                    <button onClick={closeAlert} className="btn-primary" style={{ width: '100%' }}>OK</button>
                </div>
            )}

            {/* Confirm Box */}
            {confirmConfig && (
                <div className="card" style={{ width: '90%', maxWidth: '400px', margin: 0, textAlign: 'center' }}>
                    <h3 style={{ marginBottom: '15px' }}>Confirm Action</h3>
                    <p style={{ marginBottom: '25px', fontSize: '1.05rem' }}>{confirmConfig.message}</p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => closeConfirm(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                        <button onClick={() => closeConfirm(true)} className="btn-danger" style={{ flex: 1 }}>Confirm</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GlobalDialogs;
