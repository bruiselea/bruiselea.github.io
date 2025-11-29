import { useState, useEffect } from 'react';
import { Viewer3D } from './components/Viewer3D';
import { ControlPanel } from './components/ControlPanel';
import { parseCIF } from './lib/cif-parser';
import { StructureManager, type Atom, type Bond } from './lib/structure-manager';
import { CSGGenerator, type PrintableAtom } from './lib/csg-generator';
import { Exporter } from './lib/exporter';

function App() {
  const [cifContent, setCifContent] = useState<string>('');
  const [params, setParams] = useState({
    atomRadiusScale: 0.5,
    bondRadius: 0.15,
    bondCutoff: 2.8,
    supercell: [2, 2, 2] as [number, number, number],
  });
  const [structure, setStructure] = useState<{ atoms: Atom[]; bonds: Bond[] }>({ atoms: [], bonds: [] });
  const [printableAtoms, setPrintableAtoms] = useState<PrintableAtom[] | undefined>(undefined);
  const [isProcessing, setIsProcessing] = useState(false);

  // Process CIF when content or params change
  useEffect(() => {
    if (!cifContent) return;

    setIsProcessing(true);
    // Use timeout to allow UI to update
    setTimeout(() => {
      try {
        const data = parseCIF(cifContent);
        const manager = new StructureManager(data);
        const result = manager.generateStructure(params.supercell, params.bondCutoff);
        setStructure(result);
        setPrintableAtoms(undefined); // Reset printable on structure change
      } catch (error) {
        console.error("Error processing CIF:", error);
        alert("Failed to parse CIF file.");
      } finally {
        setIsProcessing(false);
      }
    }, 100);
  }, [cifContent, params.supercell, params.bondCutoff]); // Re-run only on structural changes

  const handleGenerate = () => {
    if (structure.atoms.length === 0) return;
    setIsProcessing(true);
    setTimeout(() => {
      try {
        const generator = new CSGGenerator();
        const result = generator.generatePrintableAtoms(
          structure.atoms,
          structure.bonds,
          params.atomRadiusScale,
          params.bondRadius,
          0.1 // tolerance (reduced from 0.2 to prevent destroying small atoms)
        );
        setPrintableAtoms(result);
      } catch (error) {
        console.error("Error generating printable model:", error);
        alert("Failed to generate printable model.");
      } finally {
        setIsProcessing(false);
      }
    }, 100);
  };

  const uniqueElements = Array.from(new Set(structure.atoms.map(a => a.symbol))).sort();

  const handleExport = (type: 'atoms' | 'bonds', element?: string) => {
    const exporter = new Exporter();
    if (type === 'atoms') {
      if (!printableAtoms) {
        alert("Please generate the printable model first.");
        return;
      }
      
      let atomsToExport = printableAtoms;
      let filename = 'atoms.stl';
      
      if (element) {
        atomsToExport = printableAtoms.filter(a => a.symbol === element);
        filename = `${element}_atoms.stl`;
      }
      
      const obj = exporter.exportAtoms(atomsToExport);
      exporter.downloadFile(obj, filename);
    } else {
      const obj = exporter.exportBonds(structure.bonds, params.bondRadius);
      exporter.downloadFile(obj, 'bonds.stl');
    }
  };

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      <div className="flex-1 relative">
        {structure.atoms.length > 0 ? (
          <Viewer3D
            atoms={structure.atoms}
            bonds={structure.bonds}
            printableAtoms={printableAtoms}
            atomRadiusScale={params.atomRadiusScale}
            bondRadius={params.bondRadius}
            showBonds={!printableAtoms} // Hide bonds if showing printable atoms (holes)
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <p className="text-xl mb-2">No CIF file loaded</p>
              <p className="text-sm">Upload a .cif file to begin</p>
            </div>
          </div>
        )}
        
        {/* Overlay Stats */}
        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm p-2 rounded text-xs text-gray-300">
          <p>Atoms: {structure.atoms.length}</p>
          <p>Bonds: {structure.bonds.length}</p>
        </div>
      </div>
      
      <ControlPanel
        onFileUpload={setCifContent}
        params={params}
        setParams={setParams}
        onExport={handleExport}
        onGenerate={handleGenerate}
        hasPrintable={!!printableAtoms}
        isProcessing={isProcessing}
        elements={uniqueElements}
      />
    </div>
  );
}

export default App;
