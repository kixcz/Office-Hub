import { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon(props: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img 
            src="/Ascend.png" 
            alt="Ascend Logo" 
            {...props} 
        />
    );
}
