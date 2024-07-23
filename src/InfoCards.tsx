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

  const [values, setValues] = useState<number[]>([]);
  const [conditions, setConditions] = useState<Condition[][]>([]);

  useEffect(() => {
    if (data.data.length > 0) {
      const rawValues = data.data[0].map(item => item.value || 0);
      const numericValues = rawValues.map(rawValue => typeof rawValue === 'string' ? parseFloat(rawValue) : rawValue);
      setValues(numericValues.slice(0, 10)); // Ensure up to 6 values

      const extractedConditions = numericValues.map((_, index) => {
        const bindingConditions = context?.component?.bindings?.["tray-key"]?.[index]?.settings?.conditions || [];
        return bindingConditions;
      });
      setConditions(extractedConditions);
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

  const getConditionLabel = (value: number, index: number) => {
    const sortedConditions = conditions[index]?.sort((a, b) => parseFloat(a.value) - parseFloat(b.value)) || [];
    if (!sortedConditions.length) return null;

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

    const indexColor = sortedConditions.map(cond => cond.color).indexOf(appliedColor);
    const numColors = sortedConditions.length;

    if (numColors === 1) return "Med"; // Only one condition
    if (numColors % 2 === 0) { // Even number of conditions
      if (indexColor < numColors / 2) return "Low";
      return "High";
    } else { // Odd number of conditions
      const third = Math.floor(numColors / 3);
      if (indexColor < third) return "Low";
      if (indexColor >= third * 2) return "High";
      return "Med";
    }
  };

  const getValueColor = (value: number, index: number) => {
    const sortedConditions = conditions[index]?.sort((a, b) => parseFloat(a.value) - parseFloat(b.value)) || [];
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
      {values.map((value, index) => {
        const conditionLabel = getConditionLabel(value, index);
        return (
          <div key={index} style={{
            width: '150px',
            height: '110px',
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
            {conditionLabel && (
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
                  backgroundColor: getValueColor(value, index),
                  borderRadius: `${borderRadius}px`,
                  padding: '5px 10px',
                  color: '#FFF',
                  fontSize: '12px'
                }}>
                  {conditionLabel}
                </div>
              </div>
            )}
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
              <span style={{ color: getValueColor(value, index), fontSize: '24pt' }}>{formatValue(value)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default InfoCards;
