import { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon(props: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img 
            src="/velora_logo-removebg-preview.png" 
            alt="Velora Logo" 
            {...props} 
        />
    );
}
