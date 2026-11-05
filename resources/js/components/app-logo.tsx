import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 group-data-[collapsible=icon]:size-7 items-center justify-center rounded-lg overflow-hidden bg-[#F7F7FB] dark:bg-[#1E1B38] border border-[#A78BFA]/30 shrink-0 p-0.5 shadow-2xs">
                <AppLogoIcon className="size-full object-contain" />
            </div>
            <div className="ml-1.5 grid flex-1 text-left text-sm group-data-[collapsible=icon]:hidden">
                <span className="mb-0.5 truncate leading-none font-black tracking-tight text-[#4C1D95] dark:text-[#A78BFA]">Velora</span>
            </div>
        </>
    );
}
