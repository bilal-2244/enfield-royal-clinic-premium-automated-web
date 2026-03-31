Set objShell = WScript.CreateObject("WScript.Shell")
strHome = objShell.ExpandEnvironmentStrings("%USERPROFILE%")
strKeyPath = strHome & "\.ssh\id_ed25519_enfield"
' Run ssh-keygen with empty passphrase
objShell.Run "ssh-keygen -t ed25519 -C hvhvuubiib@gmail.com -f " & strKeyPath & " -N """" -q", 0, True
