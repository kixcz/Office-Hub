<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title inertia>{{ config('app.name', 'Ascend') }}</title>
        <link rel="icon" type="image/png" href="/Ascend.png">
        <link rel="shortcut icon" type="image/png" href="/Ascend.png">
        <link rel="apple-touch-icon" href="/Ascend.png">

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=poppins:400,500,600,700" rel="stylesheet" />

        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        @inertiaHead

        @if(!empty($page['props']['active_branding']['css_variables']))
        <style id="ascend-brand-theme">
            :root {
                @foreach($page['props']['active_branding']['css_variables'] as $varName => $varVal)
                {{ $varName }}: {{ $varVal }};
                @endforeach
            }
        </style>
        @endif
        <script>
            (function() {
                try {
                    const appearance = localStorage.getItem('appearance') || 'system';
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    if (appearance === 'dark' || (appearance === 'system' && prefersDark)) {
                        document.documentElement.classList.add('dark');
                    } else {
                        document.documentElement.classList.remove('dark');
                    }
                } catch (e) {}
            })();
        </script>
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
