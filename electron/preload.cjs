const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveChartScript: (projectId, scriptContent) => ipcRenderer.invoke('save-chart-script', projectId, scriptContent),
  loadChartScript: (projectId) => ipcRenderer.invoke('load-chart-script', projectId),
  selectOutputFolder: () => ipcRenderer.invoke('select-folder'),
  saveMatlabFigures: (data) => ipcRenderer.invoke('save-matlab-figures', data)
});
