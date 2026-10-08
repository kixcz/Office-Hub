<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'room_schedule' => [
        'spreadsheet_id' => env('ROOM_SCHEDULE_SPREADSHEET_ID', '13LtlK6wopWwYf-7Q8rgmfOwEDo6gUMMJT32-xwEeVN8'),
        'room_tab_pattern' => env('ROOM_SCHEDULE_TAB_PATTERN', '/^(CLR|COM|CHS)\s*\d*$/i'),
        'timezone' => env('ROOM_SCHEDULE_TIMEZONE', 'Asia/Manila'),
    ],

];
