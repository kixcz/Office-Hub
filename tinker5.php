<?php
$content = file_get_contents('.env');
$content = preg_replace('/G.*O.*O.*G.*L.*E.*_.*S.*H.*E.*E.*T.*S.*/s', '', $content);
$content = str_replace("\0", '', $content);
$content = trim($content);
$content .= "\n\nGOOGLE_SHEETS_API_KEY=AIzaSyDRDRCeymmgodHIyqorSJdT4sAjIxq_LXI\n";
$content .= "GOOGLE_SHEETS_SPREADSHEET_ID=15m7NI4joQRBi9X7gdpqkF7SRZFFn61wXMhv5EkfyBY0\n";
file_put_contents('.env', $content);
echo "Fixed .env";
