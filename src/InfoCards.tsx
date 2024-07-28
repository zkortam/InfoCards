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

interface Binding {
  settings: {
    conditions: Condition[];
  };
}

interface Props {
  context: Context<TContext>;
  prompts: AppliedPrompts;
  data: ResponseData;
  drillDown: onDrillDownFunction;
}

const InfoCards = ({ context, prompts, data, drillDown }: Props) => {
  const settings = context?.component?.settings;
  const breakByTrayItems = context?.component?.bindings?.["tray-key-dim"] || [];

  // Extract display settings
  const interiorColor = settings?.containerColor || "#000000";
  const interiorOpacity = settings?.containerOpacity ? settings.containerOpacity / 100 : 1;
  const borderColor = settings?.borderColor || "#000000";
  const borderOpacity = settings?.borderOpacity ? settings.borderOpacity / 100 : 1;
  const borderThickness = settings?.borderThickness || 1;
  const borderRadius = settings?.borderRadius || 10;
  const defaultTitle = settings?.title || "Data";
  const titleColor = settings?.titleColor || "#FFFFFF";
  const valueColor = settings?.valueColor || "#FFFFFF"; // Extract value color from settings
  const cardSpacing = settings?.cardSpacing || 10; // Extract card spacing from settings, default to 10px

  const [lists, setLists] = useState<number[][]>([]);
  const [titles, setTitles] = useState<string[]>([]);
  const [conditions, setConditions] = useState<Condition[][]>([]);
  const [groupLabels, setGroupLabels] = useState<string[]>([]); // New state for group labels
  const [values, setValues] = useState<number[]>([]);

  useEffect(() => {
    if (breakByTrayItems.length === 1) {
      // Mode 1: Group by "BreakBy" item and display lists of values
      const dimensionLabels = data.data.map(row => row[0].value); // Assuming first column is dimension
      setGroupLabels(dimensionLabels);

      const numberOfLists = Math.min(data.measureHeaders.length, 50); // Max of 50 lists
      const initialLists: number[][] = Array.from({ length: numberOfLists }, (_, i) =>
        data.data.map(row => Number(row[i + 1].value)) // Assuming the first column is the dimension
      );

      // Safeguard: Check if initialLists are valid, otherwise set to 0
      initialLists.forEach((list, index) => {
        if (list.length === 0 || list.every(point => point === 0)) {
          initialLists[index] = Array(50).fill(0); // Set to 50 zero values as a safeguard
        }
      });

      setLists(initialLists.map(list => list.slice(0, 50))); // Ensure up to 50 values per list

      const headers = data.measureHeaders.map(header => {
        const parts = header.label.split('.');
        return parts[parts.length - 1] || defaultTitle;
      });
      setTitles(headers.slice(0, 50)); // Ensure up to 50 titles

      const extractedConditions = initialLists.map((_, index) => {
        const binding = (context?.component?.bindings?.["tray-key"]?.[index] as unknown as Binding);
        return binding?.settings?.conditions || [];
      });
      setConditions(extractedConditions);
    } else if (breakByTrayItems.length === 2) {
      // Mode 2: No grouping, display individual values, disregard "BreakBy" tray
      if (data.data.length > 0) {
        const measureValues = data.data.map(row => row.map(item => item.value || 0));
        const numericValues = measureValues.flat().map(rawValue => typeof rawValue === 'string' ? parseFloat(rawValue) : rawValue);
        setValues(numericValues.slice(0, 10)); // Ensure up to 10 values

        const headers = data.measureHeaders.map(header => {
          const parts = header.label.split('.');
          return parts[parts.length - 1] || defaultTitle;
        });
        setTitles(headers.slice(0, 10)); // Ensure up to 10 titles

        const extractedConditions = numericValues.map((_, index) => {
          const binding = (context?.component?.bindings?.["tray-key"]?.[index] as unknown as Binding);
          return binding?.settings?.conditions || [];
        });
        setConditions(extractedConditions);
      }
    }
  }, [data]);

  const parseColor = (color: string, opacity: number) => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1e6) return (num / 1e6).toFixed(3).replace(/\.?0+$/, '') + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(3).replace(/\.?0+$/, '') + 'K';
    return num.toFixed(2).replace(/\.?0+$/, ''); // Ensure two decimal places for smaller numbers
  };

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

  const renderGroupedCards = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: `${cardSpacing}px` }}>
      {groupLabels.map((groupLabel, indexGroup) => (
        <React.Fragment key={indexGroup}>
          {groupLabel && (
            <div style={{ marginBottom: '10px', fontWeight: 'bold', fontSize: '16px', color: '#000000' }}>
              {groupLabel}
            </div>
          )}
          <div style={{ display: 'flex', gap: `${cardSpacing}px`, flexWrap: 'wrap' }}>
            {lists.map((list, listIndex) => {
              if (indexGroup >= list.length) return null; // Skip if index exceeds list length
              const value = list[indexGroup];
              const conditionLabel = getConditionLabel(value, listIndex);
              const title = titles[listIndex] || defaultTitle;
              let cardWidth = 140;
              const titleLength = title.length;

              if (conditionLabel) {
                if (titleLength > 12) {
                  cardWidth += 20;
                }
                if (titleLength >= 16) {
                  cardWidth += 10;
                }
              } else {
                if (titleLength > 11) {
                  cardWidth += 5;
                }
                if (titleLength >= 16) {
                  cardWidth += 10;
                }
              }

              if (cardWidth > 190) {
                cardWidth = 190; // Limit the maximum width to 190px
              }

              return (
                <div key={`${listIndex}-${indexGroup}`} style={{
                  width: `${cardWidth}px`,
                  height: '110px',
                  backgroundColor: parseColor(interiorColor, interiorOpacity),
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRadius: `${borderRadius}px`,
                  border: `${borderThickness}px solid ${parseColor(borderColor, borderOpacity)}`,
                  cursor: 'pointer',
                  position: 'relative',
                  padding: '0 10px', // Add padding to ensure a buffer when there is no condition label
                  overflow: 'hidden', // Ensure text does not overflow the card
                  textOverflow: 'ellipsis', // Add ellipsis for overflowing text
                  whiteSpace: 'nowrap', // Prevent text from wrapping
                }}>
                  {conditionLabel && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'flex-start',
                      width: '100%',
                      position: 'absolute',
                      top: '10px', // Add top padding for even spacing
                      left: '10px', // Ensure at least 10px space from the left border
                    }}>
                      <div style={{
                        backgroundColor: getValueColor(value, listIndex),
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
                    alignItems: conditionLabel ? 'flex-end' : 'center', // Align text based on the presence of the condition label
                    width: '100%',
                    textAlign: conditionLabel ? 'left' : 'center', // Adjust text alignment
                    padding: conditionLabel ? '10px 20px 10px 10px' : '10px 5px', // Adjust padding based on the presence of the condition label and 5px for no condition label
                  }}>
                    <span style={{ color: titleColor, fontSize: '14px', marginBottom: '5px' }}>{title}</span>
                    <span style={{ color: getValueColor(value, listIndex), fontSize: '24pt', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{formatNumber(value)}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ width: '100%', height: '20px' }}></div> {/* Space between index groups */}
        </React.Fragment>
      ))}
    </div>
  );

  const renderIndividualCards = () => (
    <div style={{ display: 'flex', gap: `${cardSpacing}px`, flexWrap: 'wrap' }}>
      {values.filter(value => value !== 0).map((value, index) => { // Filter out zero values
        const conditionLabel = getConditionLabel(value, index);
        const title = titles[index] || defaultTitle;
        let cardWidth = 140;
        const titleLength = title.length;

        if (conditionLabel) {
          if (titleLength > 12) {
            cardWidth += 20;
          }
          if (titleLength >= 16) {
            cardWidth += 10;
          }
        } else {
          if (titleLength > 11) {
            cardWidth += 5;
          }
          if (titleLength >= 16) {
            cardWidth += 10;
          }
        }

        if (cardWidth > 190) {
          cardWidth = 190; // Limit the maximum width to 190px
        }

        return (
          <div key={index} style={{
            width: `${cardWidth}px`,
            height: '110px',
            backgroundColor: parseColor(interiorColor, interiorOpacity),
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: `${borderRadius}px`,
            border: `${borderThickness}px solid ${parseColor(borderColor, borderOpacity)}`,
            cursor: 'pointer',
            position: 'relative',
            padding: '0 10px', // Add padding to ensure a buffer when there is no condition label
            overflow: 'hidden', // Ensure text does not overflow the card
            textOverflow: 'ellipsis', // Add ellipsis for overflowing text
            whiteSpace: 'nowrap', // Prevent text from wrapping
          }}>
            {conditionLabel && (
              <div style={{
                display: 'flex',
                justifyContent: 'flex-start',
                width: '100%',
                position: 'absolute',
                top: '10px', // Add top padding for even spacing
                left: '10px', // Ensure at least 10px space from the left border
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
              alignItems: conditionLabel ? 'flex-end' : 'center', // Align text based on the presence of the condition label
              width: '100%',
              textAlign: conditionLabel ? 'left' : 'center', // Adjust text alignment
              padding: conditionLabel ? '10px 20px 10px 10px' : '10px 5px', // Adjust padding based on the presence of the condition label and 5px for no condition label
            }}>
              <span style={{ color: titleColor, fontSize: '14px', marginBottom: '5px' }}>{title}</span>
              <span style={{ color: getValueColor(value, index), fontSize: '24pt', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{formatNumber(value)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );

  return breakByTrayItems.length === 1 ? renderGroupedCards() : renderIndividualCards();
};

export default InfoCards;
