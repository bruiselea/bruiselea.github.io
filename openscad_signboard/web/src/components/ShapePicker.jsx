import React from 'react';

const shapes = [
  { id: 'HOUSE', name: 'House' },
  { id: 'SQUARE', name: 'Square' },
  { id: 'PENTAGON', name: 'Pentagon' },
  { id: 'CIRCLE', name: 'Circle' }
];

export function ShapePicker({ selected, onSelect }) {
  return (
    <div style={{ display: 'flex', gap: '10px' }}>
      {shapes.map(shape => (
        <button
          key={shape.id}
          onClick={() => onSelect(shape.id)}
          style={{
            padding: '10px',
            border: selected === shape.id ? '2px solid blue' : '1px solid #ccc',
            borderRadius: '8px',
            background: 'white',
            cursor: 'pointer'
          }}
        >
          {shape.name}
        </button>
      ))}
    </div>
  );
}
