<?php
$lines = file("config/tools.php");
// Show lines 605-613
for ($i = 604; $i < 613; $i++) {
    echo ($i + 1) . ': ' . $lines[$i];
}
echo "\n";
// Check for trailing commas in tools array
for ($i = 580; $i < 613; $i++) {
    $line = trim($lines[$i]);
    if (preg_match('/^\],$/', $line)) {
        echo "Trailing comma at line " . ($i + 1) . ": " . $lines[$i];
    }
}
