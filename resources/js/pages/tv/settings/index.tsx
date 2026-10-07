import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'TV Display Settings', href: '/tv-config/settings' },
];

export default function SettingIndex({ settings }: any) {
    const { data, setData, post, processing } = useForm({
        settings: {
            display_name: settings.display_name || '',
            fullscreen_mode: settings.fullscreen_mode === '1',
            refresh_interval: settings.refresh_interval || '60',
            show_clock: settings.show_clock === '1',
            show_footer: settings.show_footer === '1',
            show_faculty_names: settings.show_faculty_names === '1',
            academic_term: settings.academic_term || '',
        }
    });

    const submit = (e: any) => {
        e.preventDefault();
        
        // Convert booleans back to '1' or '0' string for db
        const payload = {
            settings: {
                ...data.settings,
                fullscreen_mode: data.settings.fullscreen_mode ? '1' : '0',
                show_clock: data.settings.show_clock ? '1' : '0',
                show_footer: data.settings.show_footer ? '1' : '0',
                show_faculty_names: data.settings.show_faculty_names ? '1' : '0',
            }
        };

        // manual inertia post to bypass form strictness easily
        post('/tv-config/settings', {
            data: payload
        } as any);
    };

    const updateSetting = (key: string, value: any) => {
        setData('settings', { ...data.settings, [key]: value });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Display Settings" />
            <div className="p-4 flex flex-col gap-8 max-w-3xl">
                <div className="bg-white p-6 rounded-md shadow">
                    <h2 className="text-xl font-bold mb-4">Global Display Settings</h2>
                    <form onSubmit={submit} className="flex flex-col gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label>TV Display Name</Label>
                                <Input value={data.settings.display_name} onChange={e => updateSetting('display_name', e.target.value)} />
                                <p className="text-xs text-gray-500 mt-1">e.g. Internal Staff Display</p>
                            </div>
                            <div>
                                <Label>Academic Term Label</Label>
                                <Input value={data.settings.academic_term} onChange={e => updateSetting('academic_term', e.target.value)} />
                            </div>
                            <div>
                                <Label>Data Refresh Interval (seconds)</Label>
                                <Input type="number" min="30" value={data.settings.refresh_interval} onChange={e => updateSetting('refresh_interval', e.target.value)} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="fullscreen_mode" checked={data.settings.fullscreen_mode} onCheckedChange={c => updateSetting('fullscreen_mode', c)} />
                                <Label htmlFor="fullscreen_mode">Enable Fullscreen Mode</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="show_clock" checked={data.settings.show_clock} onCheckedChange={c => updateSetting('show_clock', c)} />
                                <Label htmlFor="show_clock">Show Clock and Date</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="show_footer" checked={data.settings.show_footer} onCheckedChange={c => updateSetting('show_footer', c)} />
                                <Label htmlFor="show_footer">Show Global Footer Ticker</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="show_faculty_names" checked={data.settings.show_faculty_names} onCheckedChange={c => updateSetting('show_faculty_names', c)} />
                                <Label htmlFor="show_faculty_names">Allow Faculty Names (Privacy)</Label>
                            </div>
                        </div>

                        <Button type="submit" disabled={processing} className="w-fit">Save Settings</Button>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
