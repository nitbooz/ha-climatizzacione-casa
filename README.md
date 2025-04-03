# Home Assistant - Climatizzazione Casa

Una card Lovelace personalizzata per Home Assistant che permette di gestire la climatizzazione di tutta la casa. Questa card offre un'interfaccia moderna e intuitiva per controllare i termostati e i termoconvettori, visualizzare la temperatura media della casa e monitorare l'indice di muffa in diversi ambienti.

## Funzionalità

- **Termostati**: Controllo di 5 ambienti diversi con funzioni caldo/freddo e visualizzazione della temperatura corrente
- **Termoconvettori**: Controllo di 2 termoconvettori per gli ambienti bagno con interruttore on/off
- **Temperatura Media**: Visualizzazione della temperatura media di tutta la casa calcolata dai sensori disponibili
- **Indice di Muffa**: Monitoraggio dei sensori mold index con indicazione visiva del livello di rischio
- **Interfaccia a Tab**: Navigazione semplificata tra le diverse sezioni della card
- **Design Responsive**: Layout ottimizzato per dispositivi mobili e desktop
- **Tema Chiaro/Scuro**: Supporto automatico per il tema chiaro e scuro di Home Assistant
- **Tailwind CSS**: Interfaccia moderna e reattiva con animazioni fluide

## Installazione

### HACS (consigliato)

1. Assicurati di avere [HACS](https://hacs.xyz/) installato
2. Vai su HACS > Frontend
3. Clicca sul pulsante + in basso a destra
4. Cerca "Climatizzazione Casa"
5. Clicca su Installa

### Manuale

1. Scarica i file da questo repository
2. Copia la cartella `climatizzazione-casa` nella directory `/config/www/` del tuo Home Assistant
3. Aggiungi la seguente configurazione in `configuration.yaml`:

```yaml
lovelace:
  resources:
    - url: /local/climatizzazione-casa/climatizzazione-casa.js
      type: module
```

4. Riavvia Home Assistant

## Configurazione

Aggiungi la card alla tua dashboard Lovelace:

```yaml
type: 'custom:climatizzazione-casa'
name: Climatizzazione Casa
entities:
  # Configurazione dei termostati per i 5 ambienti
  termostati:
    - nome: Soggiorno
      climate_entity: climate.soggiorno
      temperature_entity: sensor.temperatura_soggiorno
    - nome: Camera da letto
      climate_entity: climate.camera_da_letto
      temperature_entity: sensor.temperatura_camera_da_letto
    - nome: Cucina
      climate_entity: climate.cucina
      temperature_entity: sensor.temperatura_cucina
    - nome: Studio
      climate_entity: climate.studio
      temperature_entity: sensor.temperatura_studio
    - nome: Ingresso
      climate_entity: climate.ingresso
      temperature_entity: sensor.temperatura_ingresso
  
  # Configurazione dei termoconvettori per i 2 bagni
  termoconvettori:
    - nome: Bagno principale
      switch_entity: switch.termoconvettore_bagno_principale
      temperature_entity: sensor.temperatura_bagno_principale
    - nome: Bagno secondario
      switch_entity: switch.termoconvettore_bagno_secondario
      temperature_entity: sensor.temperatura_bagno_secondario
  
  # Sensori temperatura per calcolo media
  sensori_temperatura:
    - sensor.temperatura_soggiorno
    - sensor.temperatura_camera_da_letto
    - sensor.temperatura_cucina
    - sensor.temperatura_studio
    - sensor.temperatura_ingresso
    - sensor.temperatura_bagno_principale
    - sensor.temperatura_bagno_secondario
  
  # Sensori mold index
  sensori_mold_index:
    - sensor.mold_index_soggiorno
    - sensor.mold_index_camera_da_letto
    - sensor.mold_index_cucina
    - sensor.mold_index_bagno_principale
```

## Sviluppato da

- [nitbooz](https://github.com/nitbooz)