
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { LogbookEntry, LogbookEntryValues, ValouAreaItem } from '../types';
import DocumentTextIcon from './icons/DocumentTextIcon'; // Für Export

interface LogbookPageProps {
  logbookEntries: LogbookEntry[];
  onAddEntry: (entry: LogbookEntry) => void;
  onUpdateEntry: (entry: LogbookEntry) => void;
  onDeleteEntry: (entryId: string | number) => void;
  onNavigateBack: () => void;
  showAppNotification: (message?: string, type?: 'success' | 'info' | 'error', duration?: number) => void;
  valouAreas: ValouAreaItem[];
  getInitialLogbookEntryValues: () => LogbookEntryValues;
}

// Helper function to format date for chart display if needed
const formatDateForChart = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
};

// Helper function to generate report data (also used in Report view)
const getChartData = (entries: LogbookEntry[]) => {
  // Sort entries by date
  const sortedEntries = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  return sortedEntries.map(entry => ({
    date: formatDateForChart(entry.date), // Format date for display
    wellbeing: entry.wellbeing,
    goodWorkIndex: parseFloat(entry.goodWorkIndex),
    energyLevel: entry.energyLevel,
    mentalLoad: entry.mentalLoad,
    ...entry.values // Spread Valou area values
  }));
};


const LogbookPage: React.FC<LogbookPageProps> = ({
  logbookEntries,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
  onNavigateBack,
  showAppNotification,
  valouAreas,
  getInitialLogbookEntryValues
}) => {
  const [currentEntry, setCurrentEntry] = useState<LogbookEntry>({
    id: '', // Will be set on save for new entries
    date: new Date().toISOString().split('T')[0],
    wellbeing: 5,
    reflection: '',
    highlights: '',
    challenges: '',
    values: getInitialLogbookEntryValues(),
    energyLevel: 5,
    mentalLoad: 5,
    goodWorkIndex: '5.0' // Initial calculation
  });
  
  const [view, setView] = useState<'dashboard' | 'entryForm' | 'history' | 'reportView'>('dashboard');
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const valouAreaColors: { [key: string]: string } = useMemo(() => {
    return valouAreas.reduce((acc, area) => {
      acc[area.name] = area.color; // Use the exact name string as key
      return acc;
    }, {} as { [key: string]: string });
  }, [valouAreas]);


  const calculateGoodWorkIndex = useCallback((values: LogbookEntryValues): string => {
    const sum = Object.values(values).reduce((acc, val) => acc + val, 0);
    const numValues = Object.values(values).length;
    return numValues > 0 ? (sum / numValues).toFixed(1) : '0.0';
  }, []);
  
  // Update GWI in currentEntry whenever values change
  useEffect(() => {
    setCurrentEntry(prev => ({
      ...prev,
      goodWorkIndex: calculateGoodWorkIndex(prev.values)
    }));
  }, [currentEntry.values, calculateGoodWorkIndex]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('value-')) {
      const valueName = name.replace('value-', '');
      setCurrentEntry(prev => ({
        ...prev,
        values: {
          ...prev.values,
          [valueName]: parseInt(value, 10)
        }
      }));
    } else {
      setCurrentEntry(prev => ({
        ...prev,
        [name]: (name === 'wellbeing' || name === 'energyLevel' || name === 'mentalLoad')
          ? parseInt(value, 10)
          : value
      }));
    }
  };

  const resetCurrentEntryForm = useCallback(() => {
    setCurrentEntry({
      id: '',
      date: new Date().toISOString().split('T')[0],
      wellbeing: 5,
      reflection: '',
      highlights: '',
      challenges: '',
      values: getInitialLogbookEntryValues(),
      energyLevel: 5,
      mentalLoad: 5,
      goodWorkIndex: calculateGoodWorkIndex(getInitialLogbookEntryValues())
    });
    setIsEditing(false);
  }, [getInitialLogbookEntryValues, calculateGoodWorkIndex]);

  const saveEntry = () => {
    const entryToSave = {
      ...currentEntry,
      goodWorkIndex: calculateGoodWorkIndex(currentEntry.values)
    };

    if (isEditing && entryToSave.id) {
      onUpdateEntry(entryToSave);
    } else {
      // For new entries, check if an entry for this date already exists
      const existingEntryForDate = logbookEntries.find(e => e.date === currentEntry.date);
      if (existingEntryForDate) {
          if (window.confirm(`Ein Eintrag für den ${new Date(currentEntry.date).toLocaleDateString('de-DE')} existiert bereits. Möchtest Du ihn überschreiben?`)) {
              onUpdateEntry({...entryToSave, id: existingEntryForDate.id}); // Update with existing ID
          } else {
              return; // User chose not to overwrite
          }
      } else {
        onAddEntry({ ...entryToSave, id: Date.now().toString() }); // Assign new ID
      }
    }
    resetCurrentEntryForm();
    setView('dashboard'); // Or 'history' after saving
  };

  const editEntry = (entry: LogbookEntry) => {
    setCurrentEntry(entry);
    setIsEditing(true);
    setView('entryForm');
  };

  const deleteEntry = (entryId: string | number) => {
    if (window.confirm('Möchtest Du diesen Eintrag wirklich löschen?')) {
      onDeleteEntry(entryId);
       showAppNotification("Eintrag gelöscht.", "info");
    }
  };
  
  const exportJSON = () => {
    if (logbookEntries.length === 0) {
        showAppNotification("Keine Einträge zum Exportieren vorhanden.", "info");
        return;
    }
    const dataStr = JSON.stringify(logbookEntries, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'goodwork-logbook-export.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    linkElement.remove();
    showAppNotification("Logbuch-Daten als JSON exportiert.", "success");
  };

  // Dashboard Component (Adapted)
  const DashboardView = () => {
    const latestEntry = logbookEntries.length > 0
      ? [...logbookEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
      : null;

    if (!latestEntry) {
      return (
        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
          <h2 className="text-2xl font-bold mb-4 text-slate-700">Dashboard</h2>
          <p className="text-slate-600">Noch keine Einträge vorhanden. Erfasse Deinen ersten Eintrag, um das Dashboard zu sehen.</p>
           <button 
                onClick={() => setView('entryForm')} 
                className="mt-6 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md"
            >
                Ersten Eintrag erstellen
            </button>
        </div>
      );
    }
    
    const chartData = getChartData(logbookEntries);

    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-slate-700 text-center">Dein Logbuch Dashboard</h2>
        
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-3 text-slate-600">Aktuelle Werte (Letzter Eintrag: {new Date(latestEntry.date).toLocaleDateString('de-DE')})</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'GoodWork Index', value: latestEntry.goodWorkIndex, color: 'blue' },
              { label: 'Wohlbefinden', value: latestEntry.wellbeing.toString(), color: 'purple' },
              { label: 'Energielevel', value: latestEntry.energyLevel.toString(), color: 'yellow' },
              { label: 'Mental Load', value: latestEntry.mentalLoad.toString(), color: 'red' },
            ].map(item => (
              <div key={item.label} className={`bg-${item.color}-100 p-4 rounded-lg text-center shadow`}>
                <div className={`text-3xl font-bold text-${item.color}-700`}>{item.label === 'GoodWork Index' ? parseFloat(item.value).toFixed(1) : item.value}</div>
                <div className="text-sm text-slate-600 mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-3 text-slate-600">Valoubereich-Werte (Letzter Eintrag)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(latestEntry.values).map(([areaName, areaValue]) => (
              <div key={areaName} className="p-4 rounded-lg shadow" style={{ backgroundColor: `${valouAreaColors[areaName as keyof LogbookEntryValues]}20` }}> {/* Use name for color lookup */}
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-slate-700">{areaName}</span>
                  <span className="text-sm font-bold" style={{ color: valouAreaColors[areaName as keyof LogbookEntryValues] }}>{areaValue}/10</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5">
                  <div 
                    className="h-2.5 rounded-full" 
                    style={{ width: `${areaValue * 10}%`, backgroundColor: valouAreaColors[areaName as keyof LogbookEntryValues] }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="h-72 md:h-96"> {/* Increased height for better chart visibility */}
          <h3 className="text-xl font-semibold mb-3 text-slate-600">Verlauf (Letzte 7 Einträge)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData.slice(-7)} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#64748b" />
              <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} stroke="#64748b" />
              <Tooltip contentStyle={{ backgroundColor: 'white', borderRadius: '0.5rem', borderColor: '#cbd5e1' }} />
              <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '10px' }} />
              <Line type="monotone" dataKey="wellbeing" stroke="#8884d8" name="Wohlbefinden" activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="goodWorkIndex" stroke="#82ca9d" name="GoodWork Index" activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="energyLevel" stroke="#ffc658" name="Energielevel" activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="mentalLoad" stroke="#ff8042" name="Mental Load" activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // Entry Form Component (Adapted)
  const EntryFormView = () => (
    <div className="p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-slate-700">{isEditing ? 'Eintrag bearbeiten' : 'Neuer Logbucheintrag'}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-slate-700 mb-1">Datum</label>
          <input 
            type="date" 
            name="date" 
            id="date"
            value={currentEntry.date} 
            onChange={handleInputChange}
            className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label htmlFor="wellbeing" className="block text-sm font-medium text-slate-700 mb-1">Wohlbefinden (1-10): {currentEntry.wellbeing}</label>
          <input 
            type="range" 
            name="wellbeing" 
            id="wellbeing"
            min="1" max="10" 
            value={currentEntry.wellbeing} 
            onChange={handleInputChange}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
          />
        </div>
      </div>
      
      <div className="mb-6">
        <label htmlFor="reflection" className="block text-sm font-medium text-slate-700 mb-1">Tagesreflexion</label>
        <textarea 
          name="reflection" 
          id="reflection"
          value={currentEntry.reflection} 
          onChange={handleInputChange}
          className="w-full p-2 border border-slate-300 rounded-md h-24 shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="Wie war Dein Tag? Was hat Dich bewegt?"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label htmlFor="highlights" className="block text-sm font-medium text-slate-700 mb-1">Highlights des Tages</label>
          <textarea 
            name="highlights" 
            id="highlights"
            value={currentEntry.highlights} 
            onChange={handleInputChange}
            className="w-full p-2 border border-slate-300 rounded-md h-20 shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="Was waren die positiven Momente?"
          />
        </div>
        <div>
          <label htmlFor="challenges" className="block text-sm font-medium text-slate-700 mb-1">Herausforderungen</label>
          <textarea 
            name="challenges" 
            id="challenges"
            value={currentEntry.challenges} 
            onChange={handleInputChange}
            className="w-full p-2 border border-slate-300 rounded-md h-20 shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="Welchen Hürden standest Du gegenüber?"
          />
        </div>
      </div>
      
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-3 text-slate-700">Valoubereiche (1-10)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
          {valouAreas.map(area => (
            <div key={area.id}>
              <label htmlFor={`value-${area.name}`} className="block text-sm font-medium mb-1" style={{ color: area.color }}>
                {area.name}: {currentEntry.values[area.name as keyof LogbookEntryValues]}
              </label>
              <input 
                type="range" 
                name={`value-${area.name}`} 
                id={`value-${area.name}`}
                min="1" max="10" 
                value={currentEntry.values[area.name as keyof LogbookEntryValues]} 
                onChange={handleInputChange}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                style={{ accentColor: area.color }}
              />
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-blue-100 rounded-md text-center shadow">
          <p className="font-bold text-blue-700">GoodWork Index: {currentEntry.goodWorkIndex}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <label htmlFor="energyLevel" className="block text-sm font-medium text-slate-700 mb-1">Energielevel (1-10): {currentEntry.energyLevel}</label>
          <input 
            type="range" 
            name="energyLevel" 
            id="energyLevel"
            min="1" max="10" 
            value={currentEntry.energyLevel} 
            onChange={handleInputChange}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-yellow-500"
          />
        </div>
        <div>
          <label htmlFor="mentalLoad" className="block text-sm font-medium text-slate-700 mb-1">Mental Load (1-10): {currentEntry.mentalLoad}</label>
          <input 
            type="range" 
            name="mentalLoad" 
            id="mentalLoad"
            min="1" max="10" 
            value={currentEntry.mentalLoad} 
            onChange={handleInputChange}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-500"
          />
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <button 
          onClick={saveEntry} 
          className="flex-1 bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors shadow-md font-semibold"
        >
          {isEditing ? 'Änderungen speichern' : 'Eintrag speichern'}
        </button>
        <button 
          type="button"
          onClick={resetCurrentEntryForm} 
          className="flex-1 bg-slate-200 text-slate-700 py-2.5 px-4 rounded-lg hover:bg-slate-300 transition-colors shadow-md font-semibold"
        >
          Abbrechen / Zurücksetzen
        </button>
      </div>
    </div>
  );

  // History View Component (Adapted)
  const HistoryView = () => (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-700 mb-3 sm:mb-0">Eintragshistorie</h2>
        <button 
          onClick={exportJSON} 
          className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors shadow-md flex items-center gap-2"
          disabled={logbookEntries.length === 0}
          aria-label="Alle Einträge als JSON exportieren"
        >
          <DocumentTextIcon className="w-4 h-4"/> Als JSON exportieren
        </button>
      </div>
      
      {logbookEntries.length === 0 ? (
        <p className="text-slate-600 text-center py-8">Keine Einträge vorhanden.</p>
      ) : (
        <div className="space-y-4">
          {[...logbookEntries]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map(entry => (
              <div key={entry.id} className="border border-slate-200 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow bg-slate-50">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
                  <div>
                    <h3 className="font-bold text-lg text-slate-700">{new Date(entry.date).toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
                    <p className="text-sm text-slate-500">GoodWork Index: <span className="font-semibold text-blue-600">{entry.goodWorkIndex}</span></p>
                    <p className="text-sm text-slate-500">Wohlbefinden: <span className="font-semibold text-purple-600">{entry.wellbeing}</span></p>
                  </div>
                  <div className="mt-2 sm:mt-0 flex gap-2 shrink-0">
                    <button 
                      onClick={() => editEntry(entry)} 
                      className="text-xs px-3 py-1 bg-sky-500 text-white rounded-md hover:bg-sky-600 transition"
                    >
                      Bearbeiten
                    </button>
                    <button 
                      onClick={() => deleteEntry(entry.id)} 
                      className="text-xs px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
                    >
                      Löschen
                    </button>
                  </div>
                </div>
                
                {entry.reflection && (
                  <details className="mt-2 text-sm">
                    <summary className="cursor-pointer font-medium text-slate-600 hover:text-slate-800">Reflexion anzeigen</summary>
                    <p className="mt-1 text-slate-700 bg-white p-2 rounded border border-slate-100">{entry.reflection}</p>
                  </details>
                )}
                 {entry.highlights && (
                  <details className="mt-1 text-sm">
                    <summary className="cursor-pointer font-medium text-slate-600 hover:text-slate-800">Highlights anzeigen</summary>
                    <p className="mt-1 text-slate-700 bg-white p-2 rounded border border-slate-100">{entry.highlights}</p>
                  </details>
                )}
                 {entry.challenges && (
                  <details className="mt-1 text-sm">
                    <summary className="cursor-pointer font-medium text-slate-600 hover:text-slate-800">Herausforderungen anzeigen</summary>
                    <p className="mt-1 text-slate-700 bg-white p-2 rounded border border-slate-100">{entry.challenges}</p>
                  </details>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
  
  // Report View (Simplified, focusing on charts)
  const ReportView = () => {
     const chartData = getChartData(logbookEntries);
     if (logbookEntries.length === 0) {
        return (
             <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <h2 className="text-2xl font-bold mb-4 text-slate-700">Berichte</h2>
                <p className="text-slate-600">Keine Daten für Berichte vorhanden. Bitte erstelle zuerst einige Logbucheinträge.</p>
            </div>
        )
     }
     return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-slate-700 text-center">Deine Verlaufsberichte</h2>
        
        <div className="mb-10">
            <h3 className="text-xl font-semibold mb-3 text-slate-600">Gesamtindikatoren im Zeitverlauf</h3>
            <div className="h-72 md:h-96">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#64748b" />
                <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} stroke="#64748b"/>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="wellbeing" stroke="#8884d8" name="Wohlbefinden" />
                <Line type="monotone" dataKey="goodWorkIndex" stroke="#82ca9d" name="GoodWork Index" />
                <Line type="monotone" dataKey="energyLevel" stroke="#ffc658" name="Energielevel" />
                <Line type="monotone" dataKey="mentalLoad" stroke="#ff8042" name="Mental Load" />
                </LineChart>
            </ResponsiveContainer>
            </div>
        </div>
        
        <div>
            <h3 className="text-xl font-semibold mb-3 text-slate-600">Valou-Bereiche im Zeitverlauf</h3>
            <div className="h-72 md:h-96">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#64748b" />
                <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} stroke="#64748b" />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '10px' }} />
                {valouAreas.map(area => (
                    <Line 
                        key={area.id} 
                        type="monotone" 
                        dataKey={area.name} // Use name as dataKey, ensure it matches in chartData
                        stroke={area.color} 
                        name={area.name} 
                    />
                ))}
                </LineChart>
            </ResponsiveContainer>
            </div>
        </div>
      </div>
    );
  };

  const renderCurrentView = () => {
    switch (view) {
      case 'dashboard': return <DashboardView />;
      case 'entryForm': return <EntryFormView />;
      case 'history': return <HistoryView />;
      case 'reportView': return <ReportView />;
      default: return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-8">
       <button
        onClick={onNavigateBack}
        className="mb-6 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow hover:shadow-md text-sm"
      >
        Zurück zur Tool-Übersicht
      </button>
      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-700">GoodWork Logbuch</h1>
          <p className="text-lg text-slate-600 mt-1">Verfolge und verbessere Dein Wohlbefinden und Deine Arbeitszufriedenheit.</p>
        </header>
        
        <nav className="flex flex-wrap justify-center mb-8 gap-2 sm:gap-3">
          {(['dashboard', 'entryForm', 'history', 'reportView'] as const).map(v => (
            <button 
              key={v}
              onClick={() => {
                if (v === 'entryForm') { // When navigating to form, reset it for new entry unless editing
                    if (currentEntry.id && !isEditing) { // If there was an entry being edited, but user clicks nav
                        resetCurrentEntryForm();
                    }
                }
                setView(v)
              }}
              className={`px-4 py-2 text-sm sm:text-base font-medium rounded-lg shadow-sm transition-colors
                          ${view === v ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 hover:bg-blue-50'}`}
            >
              {v === 'dashboard' && 'Dashboard'}
              {v === 'entryForm' && (isEditing ? 'Eintrag bearbeiten' : 'Neuer Eintrag')}
              {v === 'history' && 'Historie'}
              {v === 'reportView' && 'Berichte'}
            </button>
          ))}
        </nav>
        
        <div className="mt-6">
            {renderCurrentView()}
        </div>
      </div>
    </div>
  );
};

export default LogbookPage;