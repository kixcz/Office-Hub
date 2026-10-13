import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 group-data-[collapsible=icon]:size-7 items-center justify-center rounded-md overflow-hidden bg-white shrink-0 p-0.5">
                <AppLogoIcon className="size-full object-contain" />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm group-data-[collapsible=icon]:hidden">
                <span className="mb-0.5 truncate leading-none font-semibold">CIDS Office Hub</span>
            </div>
        </>
    );
}
