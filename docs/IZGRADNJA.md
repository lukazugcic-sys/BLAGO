# Izgradnja BLAGO izvora

Ovo je aktualni izvor, ne minificirani web i ne APK. Javni download na stranici i dalje pokazuje zadnju objavljenu verziju dok se posebno ne odluči objava.

## Preduvjeti

- Node.js 22 (provjereno `node -v` u ovom okruženju)
- npm (lockfile je `package-lock.json`)
- Java 21 (JDK) za Android
- Android SDK, build-tools 35, platforma koja odgovara `android/variables.gradle`
- Za APK: Capacitor CLI već je ovisnost projekta (`npx cap`)

Nema potrebe za tajnim `.env`. `DATABASE_URL` nije potreban za lokalni klijent; `npm run build` preskače migraciju ako ga nema.

## Web

```bash
npm ci
npm run typecheck
npm test
npm run build
npm run dev
```

Dev sluša na portu 8080.

## Android APK

Verzija se čita iz `src/lib/game/version.ts` i `android/app/build.gradle` (`versionName` / `versionCode`). Paket je `hr.blago.game`.

```bash
npx vite build --config vite.apk.config.ts
rm -rf apk-www/apk
find apk-www -type f \( -name '*.apk' -o -name '*.zip' \) -delete
npx cap copy android
cd android && ./gradlew assembleDebug
```

Izlaz: `android/app/build/outputs/apk/debug/app-debug.apk`.

Nadogradnja preko postojeće instalacije traži **isti** signing ključ kao zadnji objavljeni APK. Taj ključ **nije** u ovom ZIP-u. Ne generiraj novi keystore: drugi potpis nije kompatibilna nadogradnja i ne treba brisati korisnički save da bi se to zaobišlo.

Javni certifikat zadnje objave (0.9.161-beta, versionCode 201) ima SHA-256 `53100d8f21ba041bc57585c8e292f46b61138c5433d24fc1033a07c14ab3b813`. Novi APK provjeri s:

```bash
apksigner verify --verbose --print-certs app-debug.apk
```

Usporedi samo javni SHA-256 certifikata. Ne ispisuj lozinku ni privatni ključ.
