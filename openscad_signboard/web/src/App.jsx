import React, { useState } from 'react';
import { ShapePicker } from './components/ShapePicker';
import { SignboardViewer } from './components/SignboardViewer';
// import axios from 'axios'; // Removed backend dependency
import { generateSignboardGeometry } from './jscad/signboardGenerator';
import { serializers } from '@jscad/io';

const { stlSerializer } = serializers;

function App() {
  const [config, setConfig] = useState({
    shape: 'HOUSE',
    logo: null,
    items: [], // { type: 'QR' | 'ICON', value: '', label: '' }
    footerText: ''
  });
  
  const [stlUrl, setStlUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const addItem = () => {
    if (config.items.length >= 5) return;
    setConfig(prev => ({
      ...prev,
      items: [...prev.items, { type: 'QR', value: '', label: '' }]
    }));
  };

  const updateItem = (index, field, val) => {
    const newItems = [...config.items];
    newItems[index] = { ...newItems[index], [field]: val };
    setConfig(prev => ({ ...prev, items: newItems }));
  };

  const removeItem = (index) => {
    const newItems = config.items.filter((_, i) => i !== index);
    setConfig(prev => ({ ...prev, items: newItems }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // 1. Prepare Parameters
      // TODO: Handle Image/Logo processing (tracing) here later
      const params = {
          shapeType: config.shape,
          width: 80, // Default or from UI
          height: 100,
          footerText: config.footerText
      };

      // 2. Generate Geometry (JSCAD)
      console.log("Generating geometry...", params);
      const objects = generateSignboardGeometry(params); 
      // objects is [{ geometry, color }, ...]
      
      // Flatten geometry for STL export (union all parts)
      // For now, just take the geometry property from each part
      const geometries = objects.map(o => o.geometry);

      // 3. Serialize to STL
      const rawData = stlSerializer.serialize({binary: true}, geometries);
      
      // 4. Create Blob URL
      const blob = new Blob(rawData, {type: 'model/stl'});
      const url = URL.createObjectURL(blob);
      
      setStlUrl(url);
      console.log("Generated URL:", url);

    } catch (e) {
      console.error(e);
      alert('Generation Error: ' + e.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>Signboard Configurator (Client-Side)</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
              <section>
                <h2>1. Select Shape</h2>
                <ShapePicker selected={config.shape} onSelect={s => setConfig({...config, shape: s})} />
              </section>

              <section>
                <h2>2. Upload Logo</h2>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={e => setConfig({...config, logo: e.target.files[0]})} 
                />
                {config.logo && <p>Selected: {config.logo.name}</p>}
              </section>

              <section>
                <h2>3. Content Slots</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {config.items.map((item, idx) => (
                    <div key={idx} style={{ padding: '10px', background: '#fff', border: '1px solid #ddd' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <strong>Slot {idx + 1}</strong>
                        <button onClick={() => removeItem(idx)}>Remove</button>
                      </div>
                      <label>
                        Type:
                        <select value={item.type} onChange={e => updateItem(idx, 'type', e.target.value)}>
                          <option value="QR">QR Code</option>
                          <option value="ICON">Icon</option>
                        </select>
                      </label>
                      <br/>
                      <label>
                        Label:
                        <input value={item.label} onChange={e => updateItem(idx, 'label', e.target.value)} placeholder="e.g. LINE" />
                      </label>
                      <br/>
                      <label>
                        {item.type === 'QR' ? 'URL' : 'Icon Name'}:
                        <input value={item.value} onChange={e => updateItem(idx, 'value', e.target.value)} />
                      </label>
                    </div>
                  ))}
                  {config.items.length < 5 && (
                    <button onClick={addItem}>+ Add Content Slot</button>
                  )}
                </div>
              </section>

              <section>
                <h2>4. Footer Text</h2>
                <input 
                  value={config.footerText} 
                  onChange={e => setConfig({...config, footerText: e.target.value})} 
                  style={{ width: '100%', padding: '5px' }}
                />
              </section>

              <div style={{ marginTop: '20px' }}>
                <button onClick={handleSubmit} disabled={loading} style={{ padding: '10px 20px', fontSize: '1.2em' }}>
                  {loading ? 'Generating...' : 'Generate 3D Model'}
                </button>
              </div>
          </div>
          
          <div>
               <h2 style={{position: 'sticky', top: 0}}>Preview</h2>
               <div style={{position: 'sticky', top: '50px'}}>
                   <SignboardViewer stlUrl={stlUrl} />
                   <p style={{fontSize: '0.8em', color: '#666'}}>
                       * Client-side generation. No server needed.
                   </p>
               </div>
          </div>
      </div>
    </div>
  );
}

export default App;
