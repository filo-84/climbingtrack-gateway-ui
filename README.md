# ClimbingTrack Hallenanzeige

React-Anzeige für die Bildschirme in der Halle. Sie fragt zuerst `GET /display/next`, lädt danach die genannte Ansicht und lässt sie für die mitgelieferten Sekunden stehen. Bestenliste, Tagesliste, die letzten Begehungen und die Store-Codes wechseln sich ab.

Zusammen mit Gateway und Datenbank, aus `climbingtrack-gateway`:

```bash
docker compose up --build -d
```

Die Seite liegt dann auf `http://localhost:9000`. Nginx gibt `/display`, `/ranking` und `/actions` an den Gateway auf Port 8090 weiter.

Lokal, mit laufendem Gateway (`climbingtrack-gateway serve`, Standard `http://localhost:8765`):

```bash
npm install
npm run dev
```

Die Seite liegt auf `http://localhost:5173` und ist im lokalen Netz erreichbar. `/display`, `/ranking` und `/actions` gehen über den Dev-Server an den Gateway.
