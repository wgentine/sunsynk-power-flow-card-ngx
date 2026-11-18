/**
 * Renders 8 essential loads per card style and layout option; saves PNGs to artifacts.
 */
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const artifacts = '/opt/cursor/artifacts';
fs.mkdirSync(artifacts, { recursive: true });

function sensor(id, state, unit = 'W') {
  return {
    entity_id: id,
    state: String(state),
    attributes: { unit_of_measurement: unit, friendly_name: id },
    last_changed: new Date().toISOString(),
    last_updated: new Date().toISOString(),
    context: { id: '1', parent_id: null, user_id: null },
  };
}

function mockStates() {
  const states = {};
  const add = (id, state, unit) => {
    states[id] = sensor(id, state, unit);
  };
  add('sensor.essential_power', 4500);
  add('sensor.day_load_energy', 12.5, 'kWh');
  for (let i = 1; i <= 8; i++) {
    add(`sensor.load_${i}`, 300 + i * 50);
    add(`sensor.load_${i}_daily`, i * 1.2, 'kWh');
  }
  add('sensor.pv1_power', 2000);
  add('sensor.pv2_power', 1500);
  add('sensor.battery_power', -500);
  add('sensor.battery_soc', 75, '%');
  add('sensor.grid_power', 100);
  return states;
}

const defaultConfig = {
  show_solar: true,
  show_battery: true,
  show_grid: true,
  disable_animations: true,
  dynamic_line_width: false,
  inverter: {
    modern: true,
    colour: '#9e9e9e',
    autarky: 'power',
    model: 'sunsynk',
    auto_scale: true,
    three_phase: false,
  },
  battery: {
    count: 1,
    shutdown_soc: 20,
    soc_end_of_charge: 100,
    colour: '#ffc0cb',
    show_daily: false,
    dynamic_colour: true,
    animate: false,
  },
  battery2: { shutdown_soc: 20, soc_end_of_charge: 100, colour: '#ffc0cb' },
  solar: {
    colour: '#ffa500',
    mppts: 2,
    show_daily: false,
    dynamic_colour: true,
    efficiency: 0,
  },
  grid: {
    colour: '#5490c2',
    show_nonessential: true,
    show_daily_buy: false,
    show_daily_sell: false,
  },
};

function baseConfig(cardstyle, loads78Layout) {
  return {
    ...defaultConfig,
    type: 'custom:sunsynk-power-flow-card',
    cardstyle,
    wide: cardstyle === 'full',
    load: {
      additional_loads: 8,
      show_aux: false,
      loads_7_8_layout: loads78Layout,
      load1_name: 'L1 EV',
      load2_name: 'L2 HW',
      load3_name: 'L3 Kitchen',
      load4_name: 'L4 Office',
      load5_name: 'L5 Pool',
      load6_name: 'L6 Shed',
      load7_name: 'L7 Garage',
      load8_name: 'L8 Workshop',
      load1_icon: 'mdi:ev-station',
      load2_icon: 'mdi:water-boiler',
      load3_icon: 'mdi:stove',
      load4_icon: 'mdi:desk',
      load5_icon: 'mdi:pool',
      load6_icon: 'mdi:home-lightning-bolt',
      load7_icon: 'mdi:garage',
      load8_icon: 'mdi:hammer-wrench',
    },
    entities: {
      essential_power: 'sensor.essential_power',
      day_load_energy_84: 'sensor.day_load_energy',
      essential_load1: 'sensor.load_1',
      essential_load2: 'sensor.load_2',
      essential_load3: 'sensor.load_3',
      essential_load4: 'sensor.load_4',
      essential_load5: 'sensor.load_5',
      essential_load6: 'sensor.load_6',
      essential_load7: 'sensor.load_7',
      essential_load8: 'sensor.load_8',
      essential_load1_extra: 'sensor.load_1_daily',
      essential_load2_extra: 'sensor.load_2_daily',
      essential_load3_extra: 'sensor.load_3_daily',
      essential_load4_extra: 'sensor.load_4_daily',
      essential_load5_extra: 'sensor.load_5_daily',
      essential_load6_extra: 'sensor.load_6_daily',
      essential_load7_extra: 'sensor.load_7_daily',
      essential_load8_extra: 'sensor.load_8_daily',
      pv1_power_186: 'sensor.pv1_power',
      pv2_power_187: 'sensor.pv2_power',
      battery_power_190: 'sensor.battery_power',
      battery_soc_184: 'sensor.battery_soc',
      grid_power_169: 'sensor.grid_power',
    },
  };
}

const LAYOUT_META = {
  'pair-row':
    'Loads 7–8 on a third row (7 left / 8 right); compact/lite uses a left column beside loads 5–6.',
  'stack-right':
    'Loads 7–8 stacked in the main right column between or below 5–6 (compact/lite infill rows).',
};

const styles = ['lite', 'compact', 'full'];
const layouts = ['pair-row', 'stack-right'];

const pageTemplate = (configJson, statesJson) => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { margin: 0; background: #111; }
    #wrap { width: 540px; height: 500px; padding: 8px; }
    sunsynk-power-flow-card { display: block; width: 100%; height: 100%; --ha-card-background: #1e1e1e; }
  </style>
</head>
<body>
  <div id="wrap"><sunsynk-power-flow-card id="card"></sunsynk-power-flow-card></div>
  <script>window.customCards = window.customCards || [];</script>
  <script type="module">
    import './dist/sunsynk-power-flow-card.js';
    const config = ${configJson};
    const states = ${statesJson};
    customElements.whenDefined('sunsynk-power-flow-card').then(() => {
      const hass = {
        states,
        locale: { language: 'en' },
        config: { unit_system: { length: 'km' } },
        themes: { darkMode: true },
        user: { name: 'Test' },
      };
      const card = document.getElementById('card');
      card.setConfig(config);
      card.hass = hass;
    });
  </script>
</body>
</html>`;

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  if (url.pathname === '/dist/sunsynk-power-flow-card.js') {
    res.setHeader('Content-Type', 'application/javascript');
    res.end(
      fs.readFileSync(path.join(root, 'dist/sunsynk-power-flow-card.js')),
    );
    return;
  }
  const style = url.searchParams.get('style') || 'lite';
  const layout = url.searchParams.get('layout') || 'pair-row';
  const html = pageTemplate(
    JSON.stringify(baseConfig(style, layout)),
    JSON.stringify(mockStates()),
  );
  res.setHeader('Content-Type', 'text/html');
  res.end(html);
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 560, height: 540 } });
const manifest = [];

for (const style of styles) {
  for (const layout of layouts) {
    await page.goto(
      `http://127.0.0.1:${port}/?style=${style}&layout=${layout}`,
      {
        waitUntil: 'load',
      },
    );
    await page.waitForFunction(
      () => {
        const card = document.getElementById('card');
        const svg = card?.shadowRoot?.querySelector('svg');
        return svg && svg.innerHTML.length > 100;
      },
      { timeout: 20000 },
    );
    await page.waitForTimeout(800);
    const filename = `loads8-${style}-${layout}.png`;
    const out = path.join(artifacts, filename);
    await page.screenshot({ path: out });
    manifest.push({
      file: out,
      style,
      layout,
      description: LAYOUT_META[layout],
    });
    console.log('saved', out);
  }
}

fs.writeFileSync(
  path.join(artifacts, 'loads8-layout-manifest.json'),
  JSON.stringify(manifest, null, 2),
);

await browser.close();
server.close();
