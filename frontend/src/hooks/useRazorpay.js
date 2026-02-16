import { useState, useEffect } from 'react';

const useRazorpay = () => {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => setIsLoaded(true);
        script.onerror = () => setIsLoaded(false);
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    return isLoaded;
};

export default useRazorpay;
