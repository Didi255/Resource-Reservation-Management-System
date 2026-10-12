# Dev helpers for poking the API from PowerShell 5.1.
# Load once per terminal:   . .\scripts\dev.ps1
#
#   $a = Login admin@example.com admin12345
#   $m = Login member@example.com member12345
#   Api /api/reservations $a
#   Api /api/reservations/3/approve $a Post
#   Api /api/reservations/1/cancel $a Post '{"reason":"Maintenance"}'

$script:BaseUrl = "http://localhost:3000"

function Login($email, $password) {
    $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
    $body = @{ email = $email; password = $password } | ConvertTo-Json
    Invoke-RestMethod -Uri "$script:BaseUrl/api/auth/login" -Method Post `
        -Body $body -ContentType "application/json" -WebSession $session | Out-Null
    return $session
}

function Api($path, $session, $method = "Get", $body = $null) {
    try {
        $result = Invoke-RestMethod -Uri "$script:BaseUrl$path" -Method $method `
            -Body $body -ContentType "application/json" -WebSession $session
        "HTTP 2xx"
        $result | ConvertTo-Json -Depth 6
    } catch {
        $response = $_.Exception.Response
        if ($response) {
            $reader = New-Object System.IO.StreamReader($response.GetResponseStream())
            "HTTP $([int]$response.StatusCode): " + $reader.ReadToEnd()
        } else {
            $_
        }
    }
}
