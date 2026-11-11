# Lite: Instagram senza reel

App personale per iPhone: Instagram (versione web) dentro un'app tua, con
- feed "Seguiti" in ordine cronologico, senza suggeriti
- niente tab Reels né griglia Esplora (la ricerca resta)
- i reel ricevuti in DM si aprono uno alla volta: se provi a scorrere al successivo torni ai DM
- swipe indietro, pull-to-refresh, login salvato
- link esterni aperti in Safari, e l'app vera di Instagram non viene mai aperta

Le regole anti-reel sono in `Resources/instagram-lite.js`.

## Strada A: con un Mac
1. Installa Xcode dall'App Store e XcodeGen: `brew install xcodegen`
2. In questa cartella: `xcodegen generate`, poi apri `IGLite.xcodeproj`
3. Xcode → target IGLite → Signing & Capabilities → Team: il tuo Apple ID (Personal Team).
   Se il bundle ID è già preso, cambialo (es. `com.tuonome.lite`)
4. Collega l'iPhone, selezionalo in alto e premi ▶︎
5. Su iPhone: Impostazioni → Privacy e sicurezza → Modalità sviluppatore → attiva.
   Poi Impostazioni → Generali → VPN e gestione dispositivi → autorizza il tuo Apple ID

## Strada B: senza Mac (Windows)
1. Crea una repo su GitHub e carica questi file (compresa la cartella `.github`)
2. Tab Actions → "Build IPA" → Run workflow. Dopo qualche minuto scarica l'artifact `IGLite-ipa`
3. Installa Sideloadly sul PC, collega l'iPhone, trascina `IGLite.ipa` e accedi con il tuo Apple ID
4. Sull'iPhone attiva Modalità sviluppatore e autorizza il profilo come sopra

Con un Apple ID gratuito l'app scade dopo 7 giorni: rifai l'ultimo passaggio
(o usa AltStore/SideStore, che la rinnovano in automatico).

## Bloccare l'app vera di Instagram
Comandi Rapidi → Automazione → + → App → Instagram → "È aperta" → Esegui subito →
azione "Apri app" → Lite. Poi togli Instagram dalla schermata Home.
