import {
  AppliedPrompts,
  Context,
  onDrillDownFunction,
  ResponseData,
  TContext
} from '@incorta-org/component-sdk';
import React, { useEffect, useState } from 'react';

interface Props {
  context: Context<TContext>;
  prompts: AppliedPrompts;
  data: ResponseData;
  drillDown: onDrillDownFunction;
}

const InfoCards = ({ context, prompts, data, drillDown }: Props) => {
  const settings = context?.component?.settings;

  const interiorColor = settings?.containerColor || "#000000";
  const interiorOpacity = settings?.containerOpacity ? settings.containerOpacity / 100 : 1;
  const borderColor = settings?.borderColor || "#000000";
  const borderOpacity = settings?.borderOpacity ? settings.borderOpacity / 100 : 1;
  const borderThickness = settings?.borderThickness || 1;
  const borderRadius = settings?.borderRadius || 0;
  const title = settings?.title || "Title";
  const titleColor = settings?.titleColor || "#FFFFFF";
  const valueColor = settings?.valueColor || "teal";

  const [value, setValue] = useState("0");

  useEffect(() => {
    if (data.data.length > 0) {
      const rawValue = data.data[0][0]?.value || "0";
      setValue(rawValue);
    }
  }, [data]);

  const parseColor = (color: string, opacity: number) => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const formatValue = (num: number) => {
    if (num < 1000000) {
      return num.toLocaleString();
    } else {
      return (num / 1000000).toFixed(3) + 'M';
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
      <div style={{ 
        width: '150px', 
        height: '120px', 
        backgroundColor: parseColor(interiorColor, interiorOpacity), 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center', 
        borderRadius: `${borderRadius}px`,
        border: `${borderThickness}px solid ${parseColor(borderColor, borderOpacity)}`
      }}>
        <span style={{ color: titleColor, fontSize: '14pt' }}>{title}</span>
        <span style={{ color: valueColor, fontSize: '24pt', marginTop: '10px' }}>{formatValue(parseInt(value, 10))}</span>
      </div>
    </div>
  );
};

export default InfoCards;
