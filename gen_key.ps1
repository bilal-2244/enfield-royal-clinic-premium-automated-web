$sshDir = Join-Path $env:USERPROFILE ".ssh"
if (!(Test-Path $sshDir)) { New-Item -ItemType Directory -Path $sshDir }
$keyPath = Join-Path $sshDir "id_ed25519_enfield"
# Use arguments array to ensure quotes are handled correctly
$args = "-t", "ed25519", "-C", "hvhvuubiib@gmail.com", "-f", $keyPath, "-N", ""
Start-Process -FilePath "ssh-keygen" -ArgumentList $args -NoNewWindow -Wait
