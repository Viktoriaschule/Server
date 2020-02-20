# Server3

## Konfiguration
1. Klone das Projekt `git clone https://github.com/Viktoriaschule/Server.git`
2. Kopiere die `config.example.json` Datei und benenne sie `config.json` 
3. Ersetzte alle Platzhalter in der `config.json` Datei durch die richtigen Werte
4. Lade den privaten Firebase Schlüssel herunter
    - Firebaseprojekt -> Einstellungen (oben links) -> Dienstkonten -> Neuen privaten Schlüssel generieren
    - Bennene die Datei `firebase.json` und verschiebe sie ins Hauptverzeichnis des Servers
5. Falls `yarn` noch nicht installiert ist, [installiere](https://classic.yarnpkg.com/en/docs/install/) es jetzt
6. Installiere alle packages: `yarn install`
7. Starte den Server `yarn start`, oder ein bestimmtes Modul: `yarn MODUL`
    - Alle Module sind in der `package.json` Datei zu finden
    
### Als dauerlösung auf einem Linux Server
1. Alles aus dem Abschnitt [Konfiguration](#konfiguration)
2. Webservice auf den in der `config.json` festgelegten Port configurieren
3. Damit der Server automatisch gestartet wird, aber auch jederzeit gestoppt und neugestartet werden kann, wird ein Service erstellt:
    - Erstelle die Datei `/etc/systemd/system/viktoriaapp.service` mit folgendem Inhalt
      ```
      [Unit]
      Description=ViktoriaApp api service
      After=mysqld.service
      Requires=mysqld.service
      StartLimitIntervalSec=0

      [Service]
      Type=simple
      Restart=always
      RestartSec=1
      User=USERNAME_FOR_THIS_SERVICE
      WorkingDirectory=DIRECTORY_TO_SERVER_FOLDER
      ExecStart=/usr/local/bin/yarn start

      [Install]
      WantedBy=multi-user.target

      ```
      Die Zeilen
      ```
      After=mysqld.service
      Requires=mysqld.service
      ```
      werden nur gebraucht wenn auf dem selben Server auch die Datenbank läuft, wenn dies nicht der Fall ist, müssen diese durch
      ```
      After=network.target
      ```
      ersetzt werden, da nicht mehr auf eine Datenbank, sondern nur aufs Netzwerk gewartet werden muss
    - Aktiviere den Service mit `sudo systemctl enable viktoriaapp.service`
    - Und starte ihn anschließend mit `sudo service start`
    - Zum neustarten einfach `sudo service restart` ausführen
    - Für die Logs kann `sudo journalctl -r -u viktoriaapp` ausgeführt werden, oder wenn live neue Logs angezeigt werden das `-r` durch ein `-f` ersetzten
