import React from 'react';

const LoadingScreen = ({ text = "Loading..." }) => {
    return (
        <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            minHeight: '40vh',
            gap: '15px'
        }}>
            <div style={{ 
                fontSize: '4rem', 
                animation: 'pulse 1.5s infinite ease-in-out' 
            }}>
                💭
            </div>
            <div style={{ 
                color: 'var(--text-secondary)', 
                fontSize: '1.2rem', 
                fontWeight: '500',
                letterSpacing: '1px'
            }}>
                {text}
            </div>
            <style>
                {`
                    @keyframes pulse {
                        0% { transform: scale(0.95); opacity: 0.7; }
                        50% { transform: scale(1.05); opacity: 1; }
                        100% { transform: scale(0.95); opacity: 0.7; }
                    }
                `}
            </style>
        </div>
    );
};

export default LoadingScreen;
