import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 group-data-[collapsible=icon]:size-7 items-center justify-center rounded-lg overflow-hidden bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#0B3A67]/20 shrink-0 p-0.5 shadow-2xs">
                <AppLogoIcon className="size-full object-contain" />
            </div>
            <div className="ml-1.5 grid flex-1 text-left text-sm group-data-[collapsible=icon]:hidden">
                <span className="mb-0.5 truncate leading-none font-black tracking-tight text-[#0B3A67] dark:text-[#F8FAFC]">Ascend</span>
            </div>
        </>
    );
}
