import React from 'react';
import { Upload, Download, Settings, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';

interface ControlPanelProps {
  onFileUpload: (content: string) => void;
  params: {
    atomRadiusScale: number;
    bondRadius: number;
    bondCutoff: number;
    supercell: [number, number, number];
  };
  setParams: React.Dispatch<React.SetStateAction<{
    atomRadiusScale: number;
    bondRadius: number;
    bondCutoff: number;
    supercell: [number, number, number];
  }>>;
  onExport: (type: 'atoms' | 'bonds', element?: string) => void;
  onGenerate: () => void;
  hasPrintable: boolean;
  isProcessing: boolean;
  elements: string[];
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  onFileUpload,
  params,
  setParams,
  onExport,
  onGenerate,
  hasPrintable,
  isProcessing,
  elements
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      onFileUpload(content);
    };
    reader.readAsText(file);
  };

  const updateParam = (key: keyof typeof params, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const updateSupercell = (index: 0 | 1 | 2, value: number) => {
    const newSupercell = [...params.supercell] as [number, number, number];
    newSupercell[index] = value;
    updateParam('supercell', newSupercell);
  };

  return (
    <div className="w-80 bg-gray-900 border-l border-gray-800 p-4 flex flex-col h-full overflow-y-auto">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <Settings className="w-5 h-5" />
        Controls
      </h2>

      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Upload CIF
        </label>
        <div className="relative">
          <input
            type="file"
            accept=".cif"
            onChange={handleFileChange}
            className="hidden"
            id="cif-upload"
          />
          <label
            htmlFor="cif-upload"
            className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-gray-800 transition-colors"
          >
            <Upload className="w-5 h-5 mr-2 text-gray-400" />
            <span className="text-sm text-gray-300">Choose File</span>
          </label>
        </div>
      </div>

      <div className="space-y-6 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Atom Radius Scale ({params.atomRadiusScale.toFixed(2)})
          </label>
          <input
            type="range"
            min="0.1"
            max="1.5"
            step="0.05"
            value={params.atomRadiusScale}
            onChange={(e) => updateParam('atomRadiusScale', parseFloat(e.target.value))}
            className="w-full accent-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Bond Radius ({params.bondRadius.toFixed(2)})
          </label>
          <input
            type="range"
            min="0.05"
            max="0.5"
            step="0.01"
            value={params.bondRadius}
            onChange={(e) => updateParam('bondRadius', parseFloat(e.target.value))}
            className="w-full accent-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Bond Cutoff ({params.bondCutoff.toFixed(1)} Å)
          </label>
          <input
            type="range"
            min="1.0"
            max="5.0"
            step="0.1"
            value={params.bondCutoff}
            onChange={(e) => updateParam('bondCutoff', parseFloat(e.target.value))}
            className="w-full accent-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Supercell ({params.supercell.join('x')})
          </label>
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <input
                key={i}
                type="number"
                min="1"
                max="10"
                value={params.supercell[i as 0|1|2]}
                onChange={(e) => updateSupercell(i as 0|1|2, parseInt(e.target.value) || 1)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-center text-sm"
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-auto space-y-3">
        <button
          onClick={onGenerate}
          disabled={isProcessing}
          className={cn(
            "w-full flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors",
            "bg-green-600 hover:bg-green-700 text-white",
            isProcessing && "opacity-50 cursor-not-allowed"
          )}
        >
          {isProcessing ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Settings className="w-4 h-4 mr-2" />}
          Generate Printable Model
        </button>

        <button
          onClick={() => onExport('atoms')}
          disabled={!hasPrintable || isProcessing}
          className={cn(
            "w-full flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors",
            "bg-blue-600 hover:bg-blue-700 text-white",
            (!hasPrintable || isProcessing) && "opacity-50 cursor-not-allowed"
          )}
        >
          <Download className="w-4 h-4 mr-2" />
          Export All Atoms (.stl)
        </button>

        {elements.map(element => (
          <button
            key={element}
            onClick={() => onExport('atoms', element)}
            disabled={!hasPrintable || isProcessing}
            className={cn(
              "w-full flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors",
              "bg-blue-800 hover:bg-blue-900 text-white",
              (!hasPrintable || isProcessing) && "opacity-50 cursor-not-allowed"
            )}
          >
            <Download className="w-4 h-4 mr-2" />
            Export {element} Atoms (.stl)
          </button>
        ))}
        <button
          onClick={() => onExport('bonds')}
          disabled={isProcessing}
          className={cn(
            "w-full flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors",
            "bg-gray-700 hover:bg-gray-600 text-white",
            isProcessing && "opacity-50 cursor-not-allowed"
          )}
        >
          <Download className="w-4 h-4 mr-2" />
          Export Bonds (.obj)
        </button>
      </div>
    </div>
  );
};
