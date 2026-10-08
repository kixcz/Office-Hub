<?php
use Illuminate\Support\Facades\Http;
$response = Http::withoutVerifying()->get('https://sheets.googleapis.com/v4/spreadsheets/15m7NI4joQRBi9X7gdpqkF7SRZFFn61wXMhv5EkfyBY0/values/Summary!A:Z?key=AIzaSyDRDRCeymmgodHIyqorSJdT4sAjIxq_LXI');
dump($response->json());
