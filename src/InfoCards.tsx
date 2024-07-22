import React, { useEffect, useState } from 'react';
import {
  AppliedPrompts,
  Context,
  onDrillDownFunction,
  ResponseData,
  TContext
} from '@incorta-org/component-sdk';

interface Condition {
  value: string;
  op: string;
  color: string;
}

interface Props {
  context: Context<TContext>;
  prompts: AppliedPrompts;
  data: ResponseData;
  drillDown: onDrillDownFunction;
}

const InfoCards = ({ context, prompts, data, drillDown }: Props) => {
  const settings = context?.component?.settings;

  // Extract display settings
  const interiorColor = settings?.containerColor || "#000000";
  const interiorOpacity = settings?.containerOpacity ? settings.containerOpacity / 100 : 1;
  const borderColor = settings?.borderColor || "#000000";
  const borderOpacity = settings?.borderOpacity ? settings.borderOpacity / 100 : 1;
  const borderThickness = settings?.borderThickness || 1;
  const borderRadius = settings?.borderRadius || 10;
  const title = settings?.title || "Title";
  const titleColor = settings?.titleColor || "#FFFFFF";
  const valueColor = settings?.valueColor || "#FFFFFF"; // Extract value color from settings
  const cardSpacing = settings?.cardSpacing || 10; // Extract card spacing from settings, default to 10px

  // Conditional Formatting Extraction
  const conditionalFormatting: Condition[] = context?.component?.bindings?.["tray-key"]?.[0]?.settings?.conditions || [];

  const [values, setValues] = useState<number[]>([]);

  useEffect(() => {
    if (data.data.length > 0) {
      const rawValues = data.data[0].map(item => item.value || 0);
      const numericValues = rawValues.map(rawValue => typeof rawValue === 'string' ? parseFloat(rawValue) : rawValue);
      setValues(numericValues.slice(0, 10)); // Ensure up to 10 values
    }
  }, [data]);

  const parseColor = (color: string, opacity: number) => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const formatValue = (num: number) => Math.round(num).toLocaleString();

  const sortedConditions = conditionalFormatting.sort((a, b) => parseFloat(a.value) - parseFloat(b.value));
  const colors = sortedConditions.map(condition => condition.color);

  const getConditionLabel = (value: number) => {
    if (!sortedConditions.length) return "None";

    let appliedColor = valueColor; // Default to valueColor if no conditions

    for (const condition of sortedConditions) {
      const threshold = parseFloat(condition.value);
      if (condition.op === '<' && value < threshold) {
        appliedColor = condition.color;
        break;
      }
      if (condition.op === '>' && value > threshold) {
        appliedColor = condition.color;
        break;
      }
      if (condition.op === '=' && value === threshold) {
        appliedColor = condition.color;
        break;
      }
      if (condition.op === '<=' && value <= threshold) {
        appliedColor = condition.color;
        break;
      }
      if (condition.op === '>=' && value >= threshold) {
        appliedColor = condition.color;
        break;
      }
    }

    const index = colors.indexOf(appliedColor);
    const numColors = colors.length;

    if (numColors === 1) return "Med"; // Only one condition
    if (numColors % 2 === 0) { // Even number of conditions
      if (index < numColors / 2) return "Low";
      return "High";
    } else { // Odd number of conditions
      const third = Math.floor(numColors / 3);
      if (index < third) return "Low";
      if (index >= third * 2) return "High";
      return "Med";
    }
  };

  const getValueColor = (value: number) => {
    if (!sortedConditions.length) return valueColor; // Use valueColor if no conditions
    for (const condition of sortedConditions) {
      const threshold = parseFloat(condition.value);
      if (condition.op === '<' && value < threshold) return condition.color;
      if (condition.op === '>' && value > threshold) return condition.color;
      if (condition.op === '=' && value === threshold) return condition.color;
      if (condition.op === '<=' && value <= threshold) return condition.color;
      if (condition.op === '>=' && value >= threshold) return condition.color;
    }
    return valueColor; // Use valueColor if no conditions match
  };

  return (
    <div style={{ display: 'flex', gap: `${cardSpacing}px`, flexWrap: 'wrap' }}>
      {values.map((value, index) => (
        <div key={index} style={{
          width: '200px',
          height: '140px',
          backgroundColor: parseColor(interiorColor, interiorOpacity),
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: `${borderRadius}px`,
          border: `${borderThickness}px solid ${parseColor(borderColor, borderOpacity)}`,
          cursor: 'pointer',
          position: 'relative'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
            position: 'absolute',
            top: '5px',
            left: '0px',
            padding: '0 10px'
          }}>
            <div style={{
              backgroundColor: getValueColor(value),
              borderRadius: `${borderRadius}px`,
              padding: '5px 10px',
              color: '#FFF',
              fontSize: '12px'
            }}>
              {getConditionLabel(value)}
            </div>
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-end',
            width: '100%',
            padding: '10px',
            paddingRight: '20px'
          }}>
            <span style={{ color: titleColor, fontSize: '14px', marginBottom: '5px' }}>{title}</span>
            <span style={{ color: getValueColor(value), fontSize: '24pt' }}>{formatValue(value)}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default InfoCards;
