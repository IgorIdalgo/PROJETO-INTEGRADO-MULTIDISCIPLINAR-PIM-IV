# Dev startup scripts for BackendHelpDesk

This file documents the start/stop PowerShell scripts added to help avoid port conflicts
and make development startup consistent.

Files added:
- `start-backend.ps1` — Stops any process listening on the configured port (default 5000), starts the backend in Development mode, redirects stdout/stderr to `backend_out.log` / `backend_err.log` and writes the started PID to `backend.pid`.
- `stop-backend.ps1` — Stops the backend using the saved PID from `backend.pid` or by finding processes listening on the configured port.

Why these scripts
- Prevents "address already in use" errors by ensuring the port is free before starting.
- Records the PID to make it easy to stop the exact process later.
- Redirects logs to files for later inspection.

Usage (PowerShell):

```powershell
# From the project root or the BackendHelpDesk folder
cd BackendHelpDesk
# Start (default port 5000)
.\start-backend.ps1
# Stop
.\stop-backend.ps1
```

Optional flags:
- `-Port <port>` — start/stop using a different port than 5000.

Examples:

```powershell
# Start backend on 5001 instead of 5000
.\start-backend.ps1 -Port 5001
# Stop backend searching port 5001
.\stop-backend.ps1 -Port 5001
```

Troubleshooting
- If `start-backend.ps1` fails to start the process, check `backend_err.log` and `backend_out.log` in the `BackendHelpDesk` folder.
- If the PID file is not created, the script will still have started the process but not recorded the PID. You can find it with: `Get-NetTCPConnection -LocalPort 5000 | Select-Object -Expand OwningProcess -Unique`.

Notes
- The scripts are intended for local development only. Do not use them in production.
- They require PowerShell with `Get-NetTCPConnection` (available in modern Windows PowerShell / PowerShell Core on Windows).
