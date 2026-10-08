<?php
use Illuminate\Support\Facades\Http;
$response = Http::withoutVerifying()->get('https://sheets.googleapis.com/v4/spreadsheets/15m7NI4joQRBi9X7gdpqkF7SRZFFn61wXMhv5EkfyBY0/values/CLR_1!A1:AZ30?key=AIzaSyDRDRCeymmgodHIyqorSJdT4sAjIxq_LXI');
file_put_contents('clr_1_dump.json', json_encode($response->json(), JSON_PRETTY_PRINT));
