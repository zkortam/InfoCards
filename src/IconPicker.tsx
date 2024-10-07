import React, { useState, useEffect, useRef } from 'react';

interface IconPickerProps {
  onPick: (icon: string, color: string) => void;
  onClose: () => void;
  onColorChange: (color: string) => void;
  onRemoveIcon: () => void;
  leftPosition: number;
  currentColor: string;
}

const IconPicker: React.FC<IconPickerProps> = ({
  onPick,
  onClose,
  onColorChange,
  onRemoveIcon,
  leftPosition,
  currentColor,
}) => {
  const [icons, setIcons] = useState<string[]>([]);
  const [search, setSearch] = useState<string>('');
  const [color, setColor] = useState<string>(currentColor);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Fetch icons from Google Fonts metadata
  useEffect(() => {
    const fetchIcons = async () => {
      try {
        const response = await fetch('https://fonts.google.com/metadata/icons');
        const data = await response.text();
        const json = JSON.parse(data.replace(")]}'", ''));
        setIcons(json.icons.map((icon: any) => icon.name));
      } catch (error) {
        console.error('Error fetching icons:', error);
      }
    };
    fetchIcons();
  }, []);

  // Update the color whenever it changes
  useEffect(() => {
    onColorChange(color);
  }, [color, onColorChange]);

  // Close the picker when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [pickerRef, onClose]);

  // Filter icons based on the search query
  const filteredIcons = icons.filter((icon) => icon.toLowerCase().includes(search.toLowerCase()));

  // Handle icon selection
  const handleIconPick = (icon: string) => {
    onPick(icon, color); // Pass the selected icon and color back to parent
    onClose(); // Close the picker
  };

  // Determine if the selected color is dark or light
  const isDarkColor = (color: string) => {
    const rgb = parseInt(color.substring(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    return luminance < 140;
  };

  // Set text color based on background color brightness
  const textColor = isDarkColor(color) ? 'white' : 'black';

  return (
    <div
      ref={pickerRef}
      style={{
        position: 'fixed',
        top: '10%',
        left: `${leftPosition}px`,
        width: '300px',
        height: '400px',
        backgroundColor: 'white',
        zIndex: 1000,
        overflowY: 'scroll',
        border: '1px solid #ccc',
        padding: '10px',
        borderRadius: '15px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ display: 'flex', gap: '5px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              borderRadius: '9999px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Close
          </button>
          <button
            onClick={onRemoveIcon}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: '2px solid red',
              backgroundColor: 'transparent',
              color: 'red',
              cursor: 'pointer',
              fontSize: '18px',
              lineHeight: '18px',
              padding: '0',
            }}
          >
            <span style={{ display: 'block', width: '16px', height: '2px', backgroundColor: 'red' }}></span>
          </button>
        </div>
        <button
          onClick={() => document.getElementById('colorPicker')?.click()}
          style={{
            padding: '10px 20px',
            borderRadius: '9999px',
            backgroundColor: color,
            color: textColor,
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Select Color
        </button>
        <input
          type="color"
          id="colorPicker"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          style={{
            display: 'none',
          }}
        />
      </div>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search icons..."
        style={{
          width: 'calc(100% - 20px)',
          padding: '10px',
          marginBottom: '10px',
          borderRadius: '9999px',
          border: '1px solid #ccc',
          fontSize: '16px',
        }}
      />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        {filteredIcons.map((icon) => (
          <span
            key={icon}
            className="material-icons"
            style={{ fontSize: '24px', cursor: 'pointer', color: color }} // Apply selected color to icon
            onClick={() => handleIconPick(icon)}
          >
            {icon}
          </span>
        ))}
      </div>
    </div>
  );
};

export default IconPicker;
