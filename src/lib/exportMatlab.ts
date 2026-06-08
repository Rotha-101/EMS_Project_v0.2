export const exportMatlabScriptsToZip = async (
  project: string,
  evalData: any,
  zipEntries: { name: string; data: Uint8Array }[],
  setProgress: (prog: any) => void
) => {
  if (!evalData || !evalData.timestamps) return;

  const plants = project === 'SNTL400' ? ['plant1', 'plant2'] : ['plant1', 'plant2', 'plant3'];

  // Common config
  let graphConfig: any = {
    lineWidths: [2, 1.6, 1.6, 1.8, 1.2], lineDash: ['solid', 'solid', 'solid', 'dash', 'dot'], traceVisible: [true, true, true, true, true],
    bgWhite: true, showGrid: true
  };
  try {
    const savedCfg = localStorage.getItem('ess_graph_config');
    if (savedCfg) graphConfig = { ...graphConfig, ...JSON.parse(savedCfg) };
  } catch(e) {}


  const generateMatlabScriptSinglePlant3Rows = (title: string, dataFilename: string, pk: string) => {
    return `% MATLAB Script for ${title}
% Make sure to place the JSON data file in the same directory as this script.

dataFilename = '${dataFilename}';
fid = fopen(dataFilename, 'r');
raw = fread(fid, '*char')';
fclose(fid);
data = jsondecode(raw);

% Convert timestamps
t = datetime(data.timestamps, 'InputFormat', 'yyyy-MM-dd''T''HH:mm:ss.SSSZ', 'TimeZone', 'UTC');
t.TimeZone = 'local';

% Extract plant data
pTotal = data.pTotal.${pk};
freq = data.freq.${pk};
cmdP = data.cmdP.${pk};
remoteP = data.remoteP.${pk};
soc = data.soc.${pk};
vab = data.vab.${pk};
vbc = data.vbc.${pk};
vca = data.vca.${pk};
qTotal = data.qTotal.${pk};
cmdQ = data.cmdQ.${pk};

% Create figure
fig = figure('Name', '${title}', 'NumberTitle', 'off', 'Position', [100, 100, 1200, 800]);
if ${graphConfig.bgWhite ? 'true' : 'false'}
    set(fig, 'Color', 'w');
else
    set(fig, 'Color', [0.1 0.1 0.18]);
end

tlo = tiledlayout(3, 1, 'TileSpacing', 'compact', 'Padding', 'compact');
title(tlo, '${title}', 'FontWeight', 'bold', 'FontSize', 12);

% Function to format axes
function formatAxis(ax, t)
    xlim(ax, [min(t) max(t)]);
    xtickformat(ax, 'HH:mm');
    xtickangle(ax, 45);
    % Try to set ticks every 30 mins
    try
        ax.XTick = dateshift(min(t), 'start', 'minute', 0) : minutes(30) : max(t);
    catch
    end
end

% --- Row 1: Frequency & Active Power ---
ax1 = nexttile;
yyaxis left;
ax1.YColor = '#0072BD';
plot(t, pTotal, 'Color', '#0072BD', 'LineWidth', ${graphConfig.lineWidths[0]});
ylabel('P (MW)');
if ${graphConfig.showGrid ? 'true' : 'false'}
    grid on;
end
yyaxis right;
ax1.YColor = '#D95319';
plot(t, freq, 'Color', '#D95319', 'LineWidth', ${graphConfig.lineWidths[1]});
ylabel('F (Hz)');
title('Frequency & Active Power');
formatAxis(ax1, t);
legend({'P total', 'Frequency'}, 'Location', 'northwest');

% --- Row 2: SOC & Active Power ---
ax2 = nexttile;
yyaxis left;
ax2.YColor = '#0072BD';
hold on;
plot(t, pTotal, 'Color', '#0072BD', 'LineWidth', ${graphConfig.lineWidths[0]});
plot(t, remoteP, 'Color', '#7E2F8E', 'LineWidth', ${graphConfig.lineWidths[2]});
ylabel('P (MW)');
if ${graphConfig.showGrid ? 'true' : 'false'}
    grid on;
end
yyaxis right;
ax2.YColor = '#D95319';
plot(t, soc, 'Color', '#D95319', 'LineWidth', ${graphConfig.lineWidths[3]});
ylabel('SOC (%)');
title('SOC & Active Power');
formatAxis(ax2, t);
legend({'P total', 'Remote Active Power', 'SOC'}, 'Location', 'northwest');

% --- Row 3: Reactive Power & Voltage ---
ax3 = nexttile;
yyaxis left;
ax3.YColor = '#0072BD';
hold on;
plot(t, vab, 'Color', '#0072BD', 'LineWidth', ${graphConfig.lineWidths[0]});
plot(t, vbc, 'Color', '#77AC30', 'LineWidth', ${graphConfig.lineWidths[1]});
plot(t, vca, 'Color', '#7E2F8E', 'LineWidth', ${graphConfig.lineWidths[2]});
ylabel('V (kV)');
if ${graphConfig.showGrid ? 'true' : 'false'}
    grid on;
end
yyaxis right;
ax3.YColor = '#D95319';
plot(t, qTotal, 'Color', '#D95319', 'LineWidth', ${graphConfig.lineWidths[3]});
stairs(t, cmdQ, 'Color', '#000000', 'LineWidth', ${graphConfig.lineWidths[4]}, 'LineStyle', '--');
ylabel('Q (MVar)');
title('Reactive Power & Voltage');
formatAxis(ax3, t);
legend({'Vab', 'Vbc', 'Vca', 'Q total'}, 'Location', 'northwest');

linkaxes([ax1, ax2, ax3], 'x');
`;
  };

  const generateMatlabScriptSinglePlant1Row = (title: string, dataFilename: string, pk: string, metric: string) => {
    return `% MATLAB Script for ${title}
% Make sure to place the JSON data file in the same directory as this script.

dataFilename = '${dataFilename}';
fid = fopen(dataFilename, 'r');
raw = fread(fid, '*char')';
fclose(fid);
data = jsondecode(raw);

% Convert timestamps
t = datetime(data.timestamps, 'InputFormat', 'yyyy-MM-dd''T''HH:mm:ss.SSSZ', 'TimeZone', 'UTC');
t.TimeZone = 'local';

% Extract plant data
pTotal = data.pTotal.${pk};
cmdP = data.cmdP.${pk};
remoteP = data.remoteP.${pk};
soc = data.soc.${pk};
vab = data.vab.${pk};
vbc = data.vbc.${pk};
vca = data.vca.${pk};
qTotal = data.qTotal.${pk};
cmdQ = data.cmdQ.${pk};

% Create figure
fig = figure('Name', '${title}', 'NumberTitle', 'off', 'Position', [100, 100, 1200, 600]);
if ${graphConfig.bgWhite ? 'true' : 'false'}
    set(fig, 'Color', 'w');
else
    set(fig, 'Color', [0.1 0.1 0.18]);
end

ax = axes(fig);
yyaxis left;
hold on;
${metric === 'fig5' ? `
ax.YColor = '#0072BD';
plot(t, pTotal, 'Color', '#0072BD', 'LineWidth', ${graphConfig.lineWidths[0]});
plot(t, remoteP, 'Color', '#7E2F8E', 'LineWidth', ${graphConfig.lineWidths[2]});
ylabel('P (MW)');
` : `
ax.YColor = '#0072BD';
plot(t, vab, 'Color', '#0072BD', 'LineWidth', ${graphConfig.lineWidths[0]});
plot(t, vbc, 'Color', '#77AC30', 'LineWidth', ${graphConfig.lineWidths[1]});
plot(t, vca, 'Color', '#7E2F8E', 'LineWidth', ${graphConfig.lineWidths[2]});
ylabel('V (kV)');
`}
if ${graphConfig.showGrid ? 'true' : 'false'}
    grid on;
end

yyaxis right;
${metric === 'fig5' ? `
ax.YColor = '#D95319';
plot(t, soc, 'Color', '#D95319', 'LineWidth', ${graphConfig.lineWidths[3]});
ylabel('SOC (%)');
legend({'P total', 'Remote Active Power', 'SOC'}, 'Location', 'northwest');
` : `
ax.YColor = '#D95319';
plot(t, qTotal, 'Color', '#D95319', 'LineWidth', ${graphConfig.lineWidths[3]});
stairs(t, cmdQ, 'Color', '#000000', 'LineWidth', ${graphConfig.lineWidths[4]}, 'LineStyle', '--');
ylabel('Q (MVar)');
legend({'Vab', 'Vbc', 'Vca', 'Q total', 'Q cmd'}, 'Location', 'northwest');
`}
title('${title}');
xlim(ax, [min(t) max(t)]);
xtickformat(ax, 'HH:mm');
xtickangle(ax, 45);
try
    ax.XTick = dateshift(min(t), 'start', 'minute', 0) : minutes(30) : max(t);
catch
end
`;
  };
  const getSubplotLayoutAllPlants = (title: string, dataFilename: string, metric: string) => {
    let script = `% MATLAB Script for ${title}
dataFilename = '${dataFilename}';
fid = fopen(dataFilename, 'r');
raw = fread(fid, '*char')';
fclose(fid);
data = jsondecode(raw);

t = datetime(data.timestamps, 'InputFormat', 'yyyy-MM-dd''T''HH:mm:ss.SSSZ', 'TimeZone', 'UTC');
t.TimeZone = 'local';

fig = figure('Name', '${title}', 'NumberTitle', 'off', 'Position', [100, 100, 1200, 800]);
if ${graphConfig.bgWhite ? 'true' : 'false'}
    set(fig, 'Color', 'w');
else
    set(fig, 'Color', [0.1 0.1 0.18]);
end

axs = [];
`;
    plants.forEach((pk, i) => {
        script += `
% --- ${pk} ---
ax = subplot(${plants.length}, 1, ${i+1});
axs = [axs, ax];
yyaxis left;
hold on;
${metric === 'f_p' ? `
plot(t, data.pTotal.${pk}, 'Color', '#0072BD', 'LineWidth', ${graphConfig.lineWidths[0]});
ylabel('P (MW)');
yyaxis right;
plot(t, data.freq.${pk}, 'Color', '#D95319', 'LineWidth', ${graphConfig.lineWidths[1]});
ylabel('F (Hz)');
legend({'P total', 'Freq'}, 'Location', 'northeastoutside');
` : metric === 'soc_p' ? `
plot(t, data.pTotal.${pk}, 'Color', '#0072BD', 'LineWidth', ${graphConfig.lineWidths[0]});
stairs(t, data.cmdP.${pk}, 'Color', '#D95319', 'LineWidth', ${graphConfig.lineWidths[1]});
plot(t, data.remoteP.${pk}, 'Color', '#731A66', 'LineWidth', ${graphConfig.lineWidths[2]});
ylabel('P (MW)');
yyaxis right;
plot(t, data.soc.${pk}, 'Color', '#D95319', 'LineWidth', ${graphConfig.lineWidths[3]});
ylabel('SOC (%)');
legend({'P total', 'P cmd', 'Remote P', 'SOC'}, 'Location', 'northeastoutside');
` : `
plot(t, data.vab.${pk}, 'Color', '#0072BD', 'LineWidth', ${graphConfig.lineWidths[0]});
plot(t, data.vbc.${pk}, 'Color', '#77AC30', 'LineWidth', ${graphConfig.lineWidths[1]});
plot(t, data.vca.${pk}, 'Color', '#7E2F8E', 'LineWidth', ${graphConfig.lineWidths[2]});
ylabel('V (kV)');
yyaxis right;
plot(t, data.qTotal.${pk}, 'Color', '#D95319', 'LineWidth', ${graphConfig.lineWidths[3]});
stairs(t, data.cmdQ.${pk}, 'Color', '#000000', 'LineWidth', ${graphConfig.lineWidths[4]});
ylabel('Q (MVar)');
legend({'Vab', 'Vbc', 'Vca', 'Q total', 'Q cmd'}, 'Location', 'northeastoutside');
`}
if ${graphConfig.showGrid ? 'true' : 'false'}
    grid on;
end
title('Plant: ${pk}');
`;
    });
    script += `
linkaxes(axs, 'x');
sgtitle('${title}');
`;
    return script;
  };


  const allScripts: { name: string; script: string; pk?: string; metric: string }[] = [];

  const addMetricScripts = (metric: string) => {
    if (metric === 'f_p') {
      allScripts.push({ name: 'Freq_Active_Power_All_Plants', script: getSubplotLayoutAllPlants('Frequency & Active Power All Plants', 'evalData.json', 'f_p'), metric });
    } else if (metric === 'soc_p') {
      allScripts.push({ name: 'SOC_Active_Power_All_Plants', script: getSubplotLayoutAllPlants('SOC & Active Power All Plants', 'evalData.json', 'soc_p'), metric });
    } else if (metric === 'v_q') {
      allScripts.push({ name: 'Reactive_Power_Voltage_All_Plants', script: getSubplotLayoutAllPlants('Reactive Power & Voltage All Plants', 'evalData.json', 'v_q'), metric });
    } else if (metric.startsWith('pf_')) {
      const pk = metric === 'pf_p1' ? 'plant1' : metric === 'pf_p2' ? 'plant2' : 'plant3';
      const label = pk === 'plant1' ? 'SWG01' : pk === 'plant2' ? 'SWG02' : 'SWG03';
      allScripts.push({
        name: label + '_Powerflow_Check',
        script: generateMatlabScriptSinglePlant3Rows(label + ' | Powerflow Check', 'evalData.json', pk),
        pk, metric
      });
    } else if (metric === 'fig4') {
      plants.forEach(pk => {
        const label = pk === 'plant1' ? 'SWG01' : pk === 'plant2' ? 'SWG02' : 'SWG03';
        allScripts.push({
          name: label + '_Powerflow_Check',
          script: generateMatlabScriptSinglePlant3Rows(label + ' | Powerflow Check', 'evalData.json', pk),
          pk, metric
        });
      });
    } else if (metric === 'fig5') {
      allScripts.push({
        name: 'Active_Power_SOC_All_Plants',
        script: getSubplotLayoutAllPlants('Active Power & SOC (All Plants)', 'evalData.json', 'soc_p'),
        metric
      });
    } else if (metric === 'fig6') {
      allScripts.push({
        name: 'Volt_Reactive_Power_All_Plants',
        script: getSubplotLayoutAllPlants('Volt & Reactive Power (All Plants)', 'evalData.json', 'v_q'),
        metric
      });
    }
  };

  if (project === 'SNTL400') {
    addMetricScripts('pf_p1');
    addMetricScripts('pf_p2');
    addMetricScripts('fig5');
    addMetricScripts('fig6');
  } else if (project === 'SNTL600') {
    addMetricScripts('pf_p1');
    addMetricScripts('pf_p2');
    addMetricScripts('pf_p3');
    addMetricScripts('fig5');
    addMetricScripts('fig6');
  } else {
    addMetricScripts('f_p');
    addMetricScripts('soc_p');
    addMetricScripts('v_q');
    addMetricScripts('fig4');
    addMetricScripts('fig5');
    addMetricScripts('fig6');
  }

  // Generate evalData.json with standardized timestamps
  const timestampsStr = evalData.timestamps.map((t: any) => new Date(t).toISOString());
  const serializedEvalData = {
    ...evalData,
    timestamps: timestampsStr
  };
  const dataJson = JSON.stringify(serializedEvalData);
  const encoder = new TextEncoder();
  zipEntries.push({
    name: `MATLAB_Export/evalData.json`,
    data: encoder.encode(dataJson)
  });

  const total = allScripts.length;
  for (let i = 0; i < total; i++) {
    const s = allScripts[i];
    setProgress({ pct: 60 + ((i + 1) / total) * 30, active: true, label: `Generating MATLAB script ${i + 1} of ${total}: ${s.name}...` });
    
    zipEntries.push({
      name: `MATLAB_Export/${s.name.replace(/\\s+/g, '_')}.m`,
      data: encoder.encode(s.script)
    });

    await new Promise(r => setTimeout(r, 0));
  }
};
