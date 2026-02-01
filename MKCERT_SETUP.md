# Setting Up mkcert for Local HTTPS Development

## Why You Need This

Modern browsers require **HTTPS (secure context)** for sensitive APIs like:

- Camera access (`getUserMedia`)
- Microphone access
- Geolocation
- Push notifications
- Service Workers

When testing on mobile devices over your local network (e.g., via Tailscale), browsers block these features on HTTP connections. The built-in `@vitejs/plugin-basic-ssl` creates a self-signed certificate, but iOS Safari blocks JavaScript from loading on sites with untrusted certificates.

**mkcert** solves this by creating a local Certificate Authority (CA) that your devices trust.

---

## Setup Instructions

### Step 1: Install mkcert (Windows)

Using Chocolatey:

```powershell
choco install mkcert
```

Or using Scoop:

```powershell
scoop install mkcert
```

### Step 2: Create Local CA

Run once to install the root CA:

```powershell
mkcert -install
```

This installs a local CA in your system's trust store.

### Step 3: Generate Certificates

Generate certs for your IP addresses:

```powershell
# Replace with your actual Tailscale IP
mkcert 100.104.13.99 localhost 127.0.0.1
```

This creates two files:

- `100.104.13.99+2.pem` (certificate)
- `100.104.13.99+2-key.pem` (private key)

### Step 4: Configure Vite

Update `vite.config.ts`:

```typescript
import fs from 'fs';
import path from 'path';

export default defineConfig({
  server: {
    port: 3002,
    host: '0.0.0.0',
    https: {
      key: fs.readFileSync(path.resolve(__dirname, '100.104.13.99+2-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, '100.104.13.99+2.pem')),
    },
  },
  // ... rest of config
});
```

---

## iPhone Setup (One-Time)

### Step 1: Find the CA Certificate

```powershell
mkcert -CAROOT
```

This shows the folder containing `rootCA.pem`.

### Step 2: Transfer to iPhone

Send `rootCA.pem` to your iPhone via:

- AirDrop
- Email attachment
- iCloud Drive

### Step 3: Install the Profile

1. Open the file on iPhone
2. You'll see "Profile Downloaded" notification
3. Go to **Settings → General → VPN & Device Management**
4. Find the mkcert profile and tap **Install**

### Step 4: Trust the Certificate

1. Go to **Settings → General → About → Certificate Trust Settings**
2. Enable **"Full Trust"** for the mkcert root certificate

---

## Verification

After setup, access `https://YOUR_TAILSCALE_IP:3002` on your iPhone:

- No certificate warnings should appear
- Camera permission prompt should work
- All HTTPS-required features should function

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Certificate not trusted | Re-install profile and enable trust in Certificate Trust Settings |
| Wrong IP in certificate | Regenerate with `mkcert NEW_IP localhost 127.0.0.1` |
| Vite can't find cert files | Use absolute paths or move certs to project root |
| iOS still shows warning | Clear Safari cache and try Private mode |
