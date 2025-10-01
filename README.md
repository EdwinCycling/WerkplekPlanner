# Werkplek Planner - Handleiding

Deze app helpt teams om werklocaties per werkdag vast te leggen (thuis, kantoor, of vrij) en een overzicht van het team te bekijken. De app gebruikt Firebase Authentication en Firestore voor opslag.

## Inhoud
- Overzicht en architectuur
- Installatie en lokaal starten
- Firebase-configuratie (Auth + Firestore)
- Datamodel (collecties en documenten)
- Firestore beveiligingsregels (alle gebruikers mogen lezen, alleen eigen data schrijven)
- Minimale reads/writes en performance
- Problemen oplossen

## Overzicht en architectuur
- Frontend: React + Vite
- Data: Firebase Authentication (Email/Password) en Firestore
- Belangrijke bestanden:
  - <mcfile name="config.ts" path="c:\Users\Edwin\Documents\Apps\werkplek-planner\firebase\config.ts"></mcfile>
  - <mcfile name="api.ts" path="c:\Users\Edwin\Documents\Apps\werkplek-planner\services\api.ts"></mcfile>
  - <mcfile name="AppContext.tsx" path="c:\Users\Edwin\Documents\Apps\werkplek-planner\contexts\AppContext.tsx"></mcfile>

## Installatie en lokaal starten
1. Vereisten: Node.js (LTS)
2. Installeer dependencies:
   - npm install
3. Start de app lokaal:
   - npm run dev

De applicatie draait nu op http://localhost:3000/ waar je de nieuwe functionaliteit kunt testen!

## Firebase-configuratie
1. Maak (of gebruik) een Firebase project.
2. Authentication:
   - Zet Email/Password login aan.
3. Firestore Database:
   - Maak een Firestore database (production of test, naar keuze).
   - De collecties worden automatisch aangemaakt door de app bij eerste gebruik:
     - users (document-id = Firebase UID)
     - schedules (document-id = Firebase UID)

Opmerking beveiliging: De Firebase client-config (apiKey, projectId etc.) in <mcfile name="config.ts" path="c:\Users\Edwin\Documents\Apps\werkplek-planner\firebase\config.ts"></mcfile> zijn publiek en geen geheimen. Voor flexibiliteit kun je deze later naar environment variables verplaatsen.

## Datamodel
- Collectie users: document per gebruiker, id = UID
  - Voorbeeld velden: name: string, email: string
- Collectie schedules: document per gebruiker, id = UID
  - Map van datum (YYYY-MM-DD) -> locatieId
  - locatieId is één van: 'home' | 'delft' | 'eindhoven' | 'gent' | 'utrecht' | 'zwolle' | 'other' | 'off' | 'scheduled_off'

Automatische aanmaak:
- Bij eerste login wordt automatisch een minimaal profiel aangemaakt in users via <mcsymbol name="getUserProfile" filename="api.ts" path="c:\Users\Edwin\Documents\Apps\werkplek-planner\services\api.ts" startline="20" type="function"></mcsymbol>.
- Bij eerste schrijfactie wordt schedules/{uid} automatisch aangemaakt via <mcsymbol name="updateScheduleEntry" filename="api.ts" path="c:\Users\Edwin\Documents\Apps\werkplek-planner\services\api.ts" startline="119" type="function"></mcsymbol> (setDoc merge).

## Firestore beveiligingsregels
Vereiste: Elke gebruiker mag alle data lezen, maar mag alleen zijn/haar eigen document schrijven/updaten.

Plaats de volgende regels in Firestore Rules (Console > Build > Firestore Database > Rules):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Profielen: iedereen mag lezen, alleen eigenaar mag schrijven
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write, update: if request.auth != null && request.auth.uid == userId;
    }

    // Roosters: iedereen mag lezen, alleen eigenaar mag schrijven
    match /schedules/{userId} {
      allow read: if request.auth != null;
      allow write, update: if request.auth != null && request.auth.uid == userId;
    }

    // Overige paden: alleen lezen voor ingelogde gebruikers, nooit schrijven
    match /{document=**} {
      allow read: if request.auth != null;
      allow write: if false;
    }
  }
}
```

Let op: De client valideert extra dat alleen de eigen gebruiker schrijft, in <mcsymbol name="updateScheduleEntry" filename="api.ts" path="c:\Users\Edwin\Documents\Apps\werkplek-planner\services\api.ts" startline="119" type="function"></mcsymbol> wordt gecontroleerd of `auth.currentUser?.uid === userId`.

## Minimale reads/writes en performance
- Reads minimaliseren:
  - Het schema wordt opgehaald per teamlid (één document per gebruiker) via <mcsymbol name="fetchSchedule" filename="api.ts" path="c:\Users\Edwin\Documents\Apps\werkplek-planner\services\api.ts" startline="80" type="function"></mcsymbol>.
  - Teamleden worden éénmalig ingeladen via <mcsymbol name="fetchTeamMembers" filename="api.ts" path="c:\Users\Edwin\Documents\Apps\werkplek-planner\services\api.ts" startline="68" type="function"></mcsymbol> en gecached in context.
- Writes minimaliseren:
  - Bij wijzigen van één dag wordt slechts één veld geschreven met setDoc(..., { merge: true }).
  - Documenten worden niet hard gecreëerd: merges zorgen voor automatische aanmaak zonder extra writes.

## Problemen oplossen
- Geen data zichtbaar: log in met een bestaande Firebase gebruiker. Zonder data toont de app vakantiedagen client-side, maar voor echte data moeten users/schedules bestaan.
- Fout "Unauthorized write": dit betekent dat een gebruiker probeert te schrijven naar een ander userId. Schrijf alleen naar je eigen UID.
- TypeScript/build fouten: voer `npm run build` uit; het project bouwt momenteel zonder fouten.
- Firestore rules: zorg dat bovenstaande regels zijn gedeployed in de Firebase console.

## Testen
- Start lokaal: `npm run dev`
- Log in met je eigen Email/Password account (aangemaakt in Firebase Auth).
- Ga naar "Set Workplace" en wijzig locaties; dit schrijft naar `schedules/{uid}`.

Beveiliging en privacy
- Geen hardcoded secrets/API keys worden gebruikt voor beveiligde backends; Firebase client keys zijn publiek, maar we adviseren ze later via env-variabelen te beheren voor flexibiliteit.
- Alle user input (datum, locatieId) wordt gevalideerd in de client voordat er naar Firestore wordt geschreven.
