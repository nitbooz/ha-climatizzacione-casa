# Installazione della Card Climatizzazione Casa

## Prerequisiti

- Home Assistant versione 2023.8.0 o superiore
- HACS (Home Assistant Community Store) installato (consigliato)

## Compilazione per Sviluppatori

Se desideri modificare o contribuire allo sviluppo della card, segui questi passaggi:

1. Assicurati di avere Node.js (versione 14 o superiore) e npm installati
2. Clona il repository:
   ```bash
   git clone https://github.com/nitbooz/ha-climatizzazione-casa.git
   cd ha-climatizzazione-casa
   ```
3. Installa le dipendenze:
   ```bash
   npm install
   ```
4. Per compilare il progetto:
   ```bash
   npm run build
   ```
5. Per lo sviluppo con ricompilazione automatica:
   ```bash
   npm run watch
   ```

## Installazione tramite HACS

1. Apri HACS nel tuo Home Assistant
2. Vai alla sezione "Frontend"
3. Clicca sul pulsante "+" in basso a destra
4. Cerca "Climatizzazione Casa"
5. Seleziona il repository e clicca su "Installa"
6. Riavvia Home Assistant

## Installazione Manuale

1. Scarica l'ultima versione dalla [pagina delle release](https://github.com/nitbooz/ha-climatizzazione-casa/releases)
2. Estrai il file ZIP
3. Copia la cartella `dist` nella directory `/config/www/climatizzazione-casa/` del tuo Home Assistant
4. Aggiungi la seguente configurazione in `configuration.yaml`:

```yaml
lovelace:
  resources:
    - url: /local/climatizzazione-casa/climatizzazione-casa.js
      type: module
```

5. Riavvia Home Assistant

## Aggiunta della Card alla Dashboard

1. Vai alla tua dashboard Lovelace
2. Clicca su "Modifica Dashboard"
3. Clicca sul pulsante "+" per aggiungere una nuova card
4. Scorri verso il basso e seleziona "Manuale"
5. Incolla la configurazione YAML (vedi esempio in `example.yaml`)
6. Clicca su "Salva"

## Risoluzione dei Problemi

Se la card non viene visualizzata correttamente:

1. Verifica che la card sia stata installata correttamente
2. Controlla che le entità specificate nella configurazione esistano nel tuo sistema
3. Svuota la cache del browser e ricarica la pagina
4. Controlla la console del browser per eventuali errori