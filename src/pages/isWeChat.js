import React from 'react';

const IsWeiXin = () => {
    if (typeof window !== 'undefined') {
        const ua = window.navigator.userAgent.toLowerCase();
        return ua.match(/MicroMessenger/i) !== 'micromessenger' ? true : false;
    } else {
        return false;
    }
};

export default IsWeiXin;
