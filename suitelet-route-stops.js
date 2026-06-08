/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/https', 'N/log', 'N/runtime'], (serverWidget, https, log, runtime) => {
  const ROUTES_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes';

  function buildForm(context, resultJson) {
    const form = serverWidget.createForm({ title: 'Suitelet de Rotas com Paradas' });

    form.addField({ id: 'custpage_origin', type: serverWidget.FieldType.TEXT, label: 'Origem' })
      .updateBreakType({ breakType: serverWidget.FieldBreakType.START });
    form.addField({ id: 'custpage_destination', type: serverWidget.FieldType.TEXT, label: 'Destino' });

    form.addField({ id: 'custpage_stops', type: serverWidget.FieldType.TEXTAREA, label: 'Paradas (uma por linha)' })
      .updateLayoutType({ layoutType: serverWidget.FieldLayoutType.NORMAL, breakType: serverWidget.FieldBreakType.START });

    form.addField({ id: 'custpage_stop_duration', type: serverWidget.FieldType.INTEGER, label: 'Duração da parada (minutos)' })
      .defaultValue = '10';

    form.addField({ id: 'custpage_travel_mode', type: serverWidget.FieldType.SELECT, label: 'Modo de viagem' })
      .addSelectOption({ value: 'DRIVE', text: 'Carro', isSelected: true })
      .addSelectOption({ value: 'TWO_WHEELER', text: 'Moto' })
      .addSelectOption({ value: 'BICYCLE', text: 'Bicicleta' })
      .addSelectOption({ value: 'WALK', text: 'A pé' });

    form.addField({ id: 'custpage_optimize', type: serverWidget.FieldType.CHECKBOX, label: 'Otimizar ordem das paradas' })
      .defaultValue = 'T';

    form.addField({ id: 'custpage_send_vehicle_stopover', type: serverWidget.FieldType.SELECT, label: 'Enviar vehicleStopover' })
      .addSelectOption({ value: 'auto', text: 'Auto', isSelected: true })
      .addSelectOption({ value: 'true', text: 'Sempre' })
      .addSelectOption({ value: 'false', text: 'Nunca' });

    form.addSubmitButton({ label: 'Calcular rota com paradas' });

    if (resultJson) {
      const resultField = form.addField({ id: 'custpage_result', type: serverWidget.FieldType.INLINEHTML, label: 'Resultado' });
      resultField.defaultValue = `<div style="white-space:pre-wrap;font-family:monospace;">${escapeHtml(resultJson)}</div>`;
    }

    return form;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function parseStops(rawStops) {
    if (!rawStops) return [];
    return rawStops.split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean);
  }

  function buildIntermediateStops(stops, durationSec, vehicleStopoverMode, travelMode) {
    const isMotorized = travelMode === 'DRIVE' || travelMode === 'TWO_WHEELER';
    const useVehicleStopover = vehicleStopoverMode === 'true' ? true : vehicleStopoverMode === 'false' ? false : isMotorized;

    return stops.map(stop => {
      const intermediate = { address: stop };
      if (useVehicleStopover) {
        intermediate.vehicleStopover = true;
      }
      if (durationSec > 0) {
        intermediate.duration = `${durationSec}s`;
      }
      return intermediate;
    });
  }

  function createRoutesPayload(origin, destination, stops, travelMode, optimize) {
    return {
      origin: { address: origin },
      destination: { address: destination },
      travelMode,
      optimizeWaypointOrder: optimize,
      languageCode: 'pt-BR',
      units: 'METRIC',
      intermediates: stops
    };
  }

  function getApiKey() {
    const script = runtime.getCurrentScript();
    return script.getParameter({ name: 'custscript_google_routes_key' }) || 'YOUR_API_KEY_AQUI';
  }

  function callRoutesApi(apiKey, payload) {
    return https.post({
      url: ROUTES_URL,
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline,routes.optimizedIntermediateWaypointIndex,routes.legs.distanceMeters,routes.legs.duration'
      }
    });
  }

  function onRequest(context) {
    if (context.request.method === 'GET') {
      context.response.writePage(buildForm(context));
      return;
    }

    const origin = context.request.parameters.custpage_origin || '';
    const destination = context.request.parameters.custpage_destination || '';
    const rawStops = context.request.parameters.custpage_stops || '';
    const stopDurationMinutes = parseInt(context.request.parameters.custpage_stop_duration, 10) || 10;
    const travelMode = context.request.parameters.custpage_travel_mode || 'DRIVE';
    const optimize = context.request.parameters.custpage_optimize === 'T';
    const vehicleStopoverMode = context.request.parameters.custpage_send_vehicle_stopover || 'auto';

    const stops = parseStops(rawStops);
    const durationSec = stopDurationMinutes * 60;
    const intermediates = buildIntermediateStops(stops, durationSec, vehicleStopoverMode, travelMode);

    const payload = createRoutesPayload(origin, destination, intermediates, travelMode, optimize);
    const apiKey = getApiKey();

    try {
      const response = callRoutesApi(apiKey, payload);
      const body = response.body;
      const formatted = typeof body === 'string' ? body : JSON.stringify(body, null, 2);
      context.response.writePage(buildForm(context, formatted));
    } catch (e) {
      log.error('Erro computeRoutes', e);
      const errorText = e.message || JSON.stringify(e);
      context.response.writePage(buildForm(context, `Erro ao chamar API:\n${escapeHtml(errorText)}`));
    }
  }

  return { onRequest };
});