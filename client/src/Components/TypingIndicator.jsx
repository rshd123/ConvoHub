import React from 'react';


const TypingIndicator = ({ users }) => {
    if (users.length === 0) return null;
    
    let text = '';
    if (users.length === 1) {
        text = `${users[0]} is typing...`;
    } else if (users.length === 2) {
        text = `${users[0]} and ${users[1]} are typing...`;
    } else {
        text = 'Several people are typing...';
    }
    
    return (
        <div className="typing-indicator msg left">
            <div className="typing-animation">
                <span></span>
                <span></span>
                <span></span>
            </div>
            <span className="typing-text">{text}</span>
        </div>
    );
};

export default TypingIndicator;