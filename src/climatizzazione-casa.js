import { LitElement, html, css } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';

class ClimatizzazioneCasa extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
      _termostati: { type: Array, state: true },
      _termoconvettori: { type: Array, state: true },
      _temperaturaMedia: { type: Number, state: true },
      _sensoriMoldIndex: { type: Array, state: true },
      _activeTab: { type: String, state: true }
    };
  }

  constructor() {
    super();
    this._termostati = [];
    this._termoconvettori = [];
    this._temperaturaMedia = 0;
    this._sensoriMoldIndex = [];
    this._activeTab = 'termostati';
  }

  setConfig(config) {
    if (!config.entities) {
      throw new Error('È necessario definire le entità');
    }

    this.config = config;
    
    // Imposta il tab predefinito se specificato nella configurazione
    if (config.options && config.options.default_tab) {
      const validTabs = ['termostati', 'termoconvettori', 'temperatura', 'mold'];
      if (validTabs.includes(config.options.default_tab)) {
        this._activeTab = config.options.default_tab;
      }
    }
  }

  getCardSize() {
    return 6;
  }

  updated(changedProps) {
    if (changedProps.has('hass') && this.hass && this.config) {
      this._updateData();
    }
  }

  _updateData() {
    // Aggiorna i dati dei termostati
    if (this.config.entities.termostati) {
      this._termostati = this.config.entities.termostati.map(termostato => {
        const climateEntity = this.hass.states[termostato.climate_entity];
        const temperatureEntity = this.hass.states[termostato.temperature_entity];
        
        return {
          nome: termostato.nome,
          climateEntity: climateEntity,
          temperatureEntity: temperatureEntity,
          currentTemperature: temperatureEntity ? parseFloat(temperatureEntity.state) : null,
          targetTemperature: climateEntity ? climateEntity.attributes.temperature : null,
          hvacMode: climateEntity ? climateEntity.state : 'off',
          hvacAction: climateEntity ? climateEntity.attributes.hvac_action : 'idle'
        };
      });
    }

    // Aggiorna i dati dei termoconvettori
    if (this.config.entities.termoconvettori) {
      this._termoconvettori = this.config.entities.termoconvettori.map(termoconvettore => {
        const switchEntity = this.hass.states[termoconvettore.switch_entity];
        const temperatureEntity = this.hass.states[termoconvettore.temperature_entity];
        
        return {
          nome: termoconvettore.nome,
          switchEntity: switchEntity,
          temperatureEntity: temperatureEntity,
          currentTemperature: temperatureEntity ? parseFloat(temperatureEntity.state) : null,
          state: switchEntity ? switchEntity.state : 'off'
        };
      });
    }

    // Calcola la temperatura media
    if (this.config.entities.sensori_temperatura) {
      const temperatures = this.config.entities.sensori_temperatura
        .map(entityId => this.hass.states[entityId])
        .filter(entity => entity && !isNaN(parseFloat(entity.state)))
        .map(entity => parseFloat(entity.state));
      
      if (temperatures.length > 0) {
        this._temperaturaMedia = temperatures.reduce((sum, temp) => sum + temp, 0) / temperatures.length;
      }
    }

    // Aggiorna i dati dei sensori mold index
    if (this.config.entities.sensori_mold_index) {
      this._sensoriMoldIndex = this.config.entities.sensori_mold_index
        .map(entityId => {
          const entity = this.hass.states[entityId];
          if (!entity) return null;
          
          return {
            entityId: entityId,
            name: entity.attributes.friendly_name || entityId.split('.').pop(),
            state: parseFloat(entity.state),
            unit: entity.attributes.unit_of_measurement || ''
          };
        })
        .filter(sensor => sensor !== null);
    }
  }

  _handleTermostatoClick(termostato) {
    const entityId = termostato.climateEntity.entity_id;
    this._showMoreInfo(entityId);
  }

  _handleTermoconvettoreToggle(termoconvettore) {
    const entityId = termoconvettore.switchEntity.entity_id;
    const service = termoconvettore.state === 'on' ? 'turn_off' : 'turn_on';
    
    this.hass.callService('switch', service, {
      entity_id: entityId
    });
  }

  _showMoreInfo(entityId) {
    const event = new CustomEvent('hass-more-info', {
      detail: { entityId }
    });
    this.dispatchEvent(event);
  }

  _getTemperatureColor(temp) {
    if (temp === null) return 'text-gray-400';
    
    if (temp < 18) return 'text-blue-500';
    if (temp < 20) return 'text-blue-300';
    if (temp < 22) return 'text-green-500';
    if (temp < 24) return 'text-yellow-500';
    if (temp < 26) return 'text-orange-500';
    return 'text-red-500';
  }

  _getMoldIndexColor(value) {
    if (value < 1) return 'text-green-500';
    if (value < 3) return 'text-yellow-500';
    if (value < 5) return 'text-orange-500';
    return 'text-red-500';
  }

  _renderTermostati() {
    return html`
      <div class="section">
        <h3 class="section-title">Termostati</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${this._termostati.map(termostato => this._renderTermostato(termostato))}
        </div>
      </div>
    `;
  }

  _renderTermostato(termostato) {
    const isActive = termostato.hvacMode !== 'off';
    const isHeating = termostato.hvacAction === 'heating';
    const isCooling = termostato.hvacAction === 'cooling';
    
    const cardClasses = {
      'card-container': true,
      'bg-white dark:bg-gray-800': true,
      'border-l-4': isActive,
      'border-orange-500': isHeating,
      'border-blue-500': isCooling
    };
    
    const tempColor = this._getTemperatureColor(termostato.currentTemperature);
    
    return html`
      <div class="${classMap(cardClasses)}" @click="${() => this._handleTermostatoClick(termostato)}">
        <div class="card-header">
          <h4 class="card-title">${termostato.nome}</h4>
          <div class="flex items-center">
            ${isHeating ? html`<span class="mode-indicator mode-heating">Riscaldamento</span>` : ''}
            ${isCooling ? html`<span class="mode-indicator mode-cooling">Raffreddamento</span>` : ''}
          </div>
        </div>
        <div class="flex flex-col items-center mt-4">
          <div class="temperature-display ${tempColor}">
            ${termostato.currentTemperature !== null ? termostato.currentTemperature.toFixed(1) : '--'}°C
          </div>
          ${termostato.targetTemperature ? html`
            <div class="temperature-target mt-2">
              Target: ${termostato.targetTemperature}°C
            </div>
          ` : ''}
          <div class="mt-3 text-sm text-gray-600 dark:text-gray-300">
            ${isActive ? (termostato.hvacMode === 'heat' ? 'Modalità: Riscaldamento' : 'Modalità: Raffreddamento') : 'Stato: Spento'}
          </div>
        </div>
      </div>
    `;
  }

  _renderTermoconvettori() {
    return html`
      <div class="section">
        <h3 class="section-title">Termoconvettori Bagno</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${this._termoconvettori.map(termoconvettore => this._renderTermoconvettore(termoconvettore))}
        </div>
      </div>
    `;
  }

  _renderTermoconvettore(termoconvettore) {
    const isOn = termoconvettore.state === 'on';
    
    const cardClasses = {
      'card-container': true,
      'bg-white dark:bg-gray-800': true,
      'border-l-4': true,
      'border-orange-500': isOn,
      'border-gray-300 dark:border-gray-600': !isOn
    };
    
    const tempColor = this._getTemperatureColor(termoconvettore.currentTemperature);
    
    return html`
      <div class="${classMap(cardClasses)}">
        <div class="card-header">
          <h4 class="card-title">${termoconvettore.nome}</h4>
          <div class="flex items-center">
            ${isOn ? html`<span class="mode-indicator mode-heating">Attivo</span>` : 
                    html`<span class="px-2 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">Spento</span>`}
          </div>
        </div>
        <div class="flex flex-col items-center mt-4">
          <div class="temperature-display ${tempColor}">
            ${termoconvettore.currentTemperature !== null ? termoconvettore.currentTemperature.toFixed(1) : '--'}°C
          </div>
          <div class="mt-4">
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" class="sr-only peer" ?checked=${isOn} @change="${() => this._handleTermoconvettoreToggle(termoconvettore)}">
              <div class="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 dark:peer-focus:ring-orange-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-orange-500"></div>
              <span class="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">${isOn ? 'Acceso' : 'Spento'}</span>
            </label>
          </div>
        </div>
      </div>
    `;
  }

  _renderTemperaturaMedia() {
    const tempColor = this._getTemperatureColor(this._temperaturaMedia);
    
    return html`
      <div class="section">
        <h3 class="section-title">Temperatura Media Casa</h3>
        <div class="card-container bg-white dark:bg-gray-800">
          <div class="flex flex-col items-center py-6">
            <div class="text-4xl font-bold ${tempColor}">
              ${this._temperaturaMedia.toFixed(1)}°C
            </div>
            <div class="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Media di tutti i sensori
            </div>
          </div>
        </div>
      </div>
    `;
  }

  _renderMoldIndex() {
    return html`
      <div class="section">
        <h3 class="section-title">Indice di Muffa</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${this._sensoriMoldIndex.map(sensor => {
            const colorClass = this._getMoldIndexColor(sensor.state);
            let statusText = '';
            if (sensor.state < 1) statusText = 'Basso';
            else if (sensor.state < 3) statusText = 'Medio';
            else if (sensor.state < 5) statusText = 'Alto';
            else statusText = 'Critico';
            
            return html`
              <div class="card-container bg-white dark:bg-gray-800" @click="${() => this._showMoreInfo(sensor.entityId)}">
                <div class="card-header">
                  <h4 class="card-title">${sensor.name}</h4>
                  <div class="px-2 py-1 rounded-full text-xs font-medium ${colorClass === 'text-green-500' ? 'mold-index-low' : colorClass === 'text-yellow-500' ? 'mold-index-medium' : colorClass === 'text-orange-500' ? 'mold-index-high' : 'mold-index-critical'}">
                    ${statusText}
                  </div>
                </div>
                <div class="flex flex-col items-center mt-4">
                  <div class="text-3xl font-bold ${colorClass}">
                    ${sensor.state.toFixed(1)} ${sensor.unit}
                  </div>
                </div>
              </div>
            `;
          })}
        </div>
      </div>
    `;
  }

  _handleTabChange(tab) {
    this._activeTab = tab;
  }

  _renderTabs() {
    // Se l'opzione show_all è impostata a true, non mostrare i tab
    if (this.config.options && this.config.options.show_all === true) {
      return html``;
    }
    
    const tabs = [
      { id: 'termostati', label: 'Termostati', icon: '🌡️', condition: this._termostati.length > 0 },
      { id: 'termoconvettori', label: 'Termoconvettori', icon: '🔥', condition: this._termoconvettori.length > 0 },
      { id: 'temperatura', label: 'Temperatura Media', icon: '🏠', condition: true },
      { id: 'mold', label: 'Indice di Muffa', icon: '💧', condition: this._sensoriMoldIndex.length > 0 }
    ].filter(tab => tab.condition);

    return html`
      <div class="flex overflow-x-auto space-x-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg mb-4">
        ${tabs.map(tab => {
          const isActive = this._activeTab === tab.id;
          return html`
            <button
              @click="${() => this._handleTabChange(tab.id)}"
              class="${classMap({
                'flex items-center px-4 py-2 rounded-lg transition-colors duration-200': true,
                'bg-white dark:bg-gray-800 shadow-md': isActive,
                'hover:bg-gray-200 dark:hover:bg-gray-600': !isActive
              })}"
            >
              <span class="mr-2">${tab.icon}</span>
              <span>${tab.label}</span>
            </button>
          `;
        })}
      </div>
    `;
  }

  _renderActiveContent() {
    switch(this._activeTab) {
      case 'termostati':
        return this._termostati.length > 0 ? this._renderTermostati() : '';
      case 'termoconvettori':
        return this._termoconvettori.length > 0 ? this._renderTermoconvettori() : '';
      case 'temperatura':
        return this._renderTemperaturaMedia();
      case 'mold':
        return this._sensoriMoldIndex.length > 0 ? this._renderMoldIndex() : '';
      default:
        return '';
    }
  }

  render() {
    if (!this.hass || !this.config) {
      return html``;
    }

    // Se l'opzione show_all è impostata a true, mostra tutti i contenuti senza tab
    const showAll = this.config.options && this.config.options.show_all === true;

    return html`
      <ha-card>
        <div class="p-4">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-semibold">${this.config.name || 'Climatizzazione Casa'}</h2>
          </div>
          ${showAll ? '' : this._renderTabs()}
          <div class="mt-4">
            ${showAll ? html`
              ${this._termostati.length > 0 ? this._renderTermostati() : ''}
              ${this._termoconvettori.length > 0 ? this._renderTermoconvettori() : ''}
              ${this._renderTemperaturaMedia()}
              ${this._sensoriMoldIndex.length > 0 ? this._renderMoldIndex() : ''}
            ` : this._renderActiveContent()}
          </div>
        </div>
      </ha-card>
    `;
  }

  static get styles() {
    return css`
      :host {
        --card-primary-color: var(--primary-color, #03a9f4);
        --card-secondary-color: var(--secondary-color, #018786);
        --card-background-color: var(--card-background-color, var(--ha-card-background, white));
        --card-text-color: var(--primary-text-color, #212121);
        --card-border-radius: var(--ha-card-border-radius, 4px);
        --card-box-shadow: var(--ha-card-box-shadow, 0px 2px 1px -1px rgba(0, 0, 0, 0.2), 0px 1px 1px 0px rgba(0, 0, 0, 0.14), 0px 1px 3px 0px rgba(0, 0, 0, 0.12));
      }

      ha-card {
        padding: 16px;
        border-radius: var(--card-border-radius);
        box-shadow: var(--card-box-shadow);
        background-color: var(--card-background-color);
        color: var(--card-text-color);
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }

      .card-title {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 500;
      }

      .card-content {
        padding: 0;
      }

      .section {
        margin-bottom: 24px;
      }

      .section-title {
        font-size: 1.2rem;
        font-weight: 500;
        margin-bottom: 16px;
        border-bottom: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
        padding-bottom: 8px;
      }

      .grid {
        display: grid;
        gap: 16px;
      }

      .grid-cols-1 {
        grid-template-columns: repeat(1, minmax(0, 1fr));
      }

      @media (min-width: 768px) {
        .md\:grid-cols-2 {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (min-width: 1024px) {
        .lg\:grid-cols-3 {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
      }

      .card {
        background-color: var(--secondary-background-color, #f5f5f5);
        border-radius: var(--card-border-radius);
        padding: 16px;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .card:hover {
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        transform: translateY(-2px);
      }

      .card-active {
        background-color: rgba(var(--rgb-primary-color, 3, 169, 244), 0.1);
      }

      .card-heating {
        border-left: 4px solid #ff9800;
      }

      .card-cooling {
        border-left: 4px solid #2196f3;
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }

      .card-title {
        font-size: 1.1rem;
        font-weight: 500;
        margin: 0;
      }

      .card-mode {
        display: flex;
        align-items: center;
      }

      .mode-icon {
        font-size: 1.2rem;
        margin-left: 8px;
      }

      .card-content {
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .temperature {
        font-size: 2rem;
        font-weight: 700;
        margin-bottom: 8px;
      }

      .temperature-media {
        font-size: 3rem;
        font-weight: 700;
        text-align: center;
      }

      .mold-index {
        font-size: 2rem;
        font-weight: 700;
        text-align: center;
      }

      .mode-label {
        font-size: 0.9rem;
        color: var(--secondary-text-color, #727272);
      }

      .text-blue-500 { color: #3b82f6; }
      .text-blue-300 { color: #93c5fd; }
      .text-green-500 { color: #22c55e; }
      .text-yellow-500 { color: #eab308; }
      .text-orange-500 { color: #f97316; }
      .text-red-500 { color: #ef4444; }
      .text-gray-400 { color: #9ca3af; }

      /* Switch styling */
      .switch {
        position: relative;
        display: inline-block;
        width: 60px;
        height: 34px;
        margin-top: 8px;
      }

      .switch input {
        opacity: 0;
        width: 0;
        height: 0;
      }

      .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #ccc;
        transition: .4s;
      }

      .slider:before {
        position: absolute;
        content: "";
        height: 26px;
        width: 26px;
        left: 4px;
        bottom: 4px;
        background-color: white;
        transition: .4s;
      }

      input:checked + .slider {
        background-color: var(--card-primary-color);
      }

      input:focus + .slider {
        box-shadow: 0 0 1px var(--card-primary-color);
      }

      input:checked + .slider:before {
        transform: translateX(26px);
      }

      .slider.round {
        border-radius: 34px;
      }

      .slider.round:before {
        border-radius: 50%;
      }
    `;
  }
}

customElements.define('climatizzazione-casa', ClimatizzazioneCasa);