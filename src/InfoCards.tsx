import {
  AppliedPrompts,
  Context,
  onDrillDownFunction,
  ResponseData,
  TContext
} from '@incorta-org/component-sdk';
import React, { useEffect, useState, useRef } from 'react';

interface Props {
  context: Context<TContext>;
  prompts: AppliedPrompts;
  data: ResponseData;
  drillDown: onDrillDownFunction;
}

interface ElseIfCondition {
  condition: string;
  threshold: number;
  color: string;
}

const InfoCards = ({ context, prompts, data, drillDown }: Props) => {
  const settings = context?.component?.settings;
  const conditionalFormatting = context?.component?.bindings?.["tray-key"]?.[0]?.settings?.conditions || [];

  const interiorColor = settings?.containerColor || "#000000";
  const interiorOpacity = settings?.containerOpacity ? settings.containerOpacity / 100 : 1;
  const borderColor = settings?.borderColor || "#000000";
  const borderOpacity = settings?.borderOpacity ? settings.borderOpacity / 100 : 1;
  const borderThickness = settings?.borderThickness || 1;
  const borderRadius = settings?.borderRadius || 10;
  const title = settings?.title || "Title";
  const titleColor = settings?.titleColor || "#FFFFFF";
  const valueColor = settings?.valueColor || "teal";
  const disableConditionsDefault = settings?.disableConditions || false;

  const [condition, setCondition] = useState(settings?.condition || ">");
  const [threshold, setThreshold] = useState(settings?.threshold || 0);
  const [conditionalColor, setConditionalColor] = useState(settings?.conditionalColor || valueColor);
  const [elseColor, setElseColor] = useState(settings?.elseColor || "#FF0000");

  const [elseIfConditions, setElseIfConditions] = useState<ElseIfCondition[]>([]);
  const [showElseIf, setShowElseIf] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [disableConditions, setDisableConditions] = useState(disableConditionsDefault);

  const colorInputRef = useRef<HTMLInputElement>(null);
  const elseColorInputRef = useRef<HTMLInputElement>(null);
  const conditionalColorInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const initialElseIfConditions: ElseIfCondition[] = [];
    for (let i = 1; i <= 5; i++) {
      const cond = settings?.[`condition${i}`];
      const thresh = settings?.[`threshold${i}`];
      const color = settings?.[`conditionalColor${i}`];
      if (cond && thresh !== undefined && color) {
        initialElseIfConditions.push({
          condition: cond,
          threshold: thresh,
          color: color
        });
      }
    }
    setElseIfConditions(initialElseIfConditions);
  }, [settings]);

  const [value, setValue] = useState(0);

  useEffect(() => {
    if (data.data.length > 0) {
      const rawValue = data.data[0][0]?.value || 0;
      const numericValue = typeof rawValue === 'string' ? parseFloat(rawValue) : rawValue;
      setValue(numericValue);
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
    return Math.round(num).toLocaleString();
  };

  const convertCondition = (condition: string) => {
    if (condition === ">" || condition === "gt") return 1;
    if (condition === "<" || condition === "lt") return -1;
    if (condition === "=" || condition === "eq") return 0;
    if (condition === ">=" || condition === "ge") return 2;
    if (condition === "<=" || condition === "le") return -2;
    return null; // Return null if condition is invalid
  };

  const checkCondition = (value: number, condition: string, threshold: number) => {
    const conditionValue = convertCondition(condition);
    if (conditionValue === 1) return value > threshold;
    if (conditionValue === -1) return value < threshold;
    if (conditionValue === 0) return value === threshold;
    if (conditionValue === 2) return value >= threshold;
    if (conditionValue === -2) return value <= threshold;
    return false;
  };

  const getValueColor = (value: number) => {
    if (disableConditions) {
      return valueColor;
    }

    for (const cond of conditionalFormatting) {
      const { operator, value: threshold, backgroundColor } = cond;
      if (checkCondition(value, operator, threshold)) {
        return backgroundColor;
      }
    }

    return elseColor;
  };

  const addElseIfCondition = () => {
    if (elseIfConditions.length < 5) {
      setElseIfConditions([
        ...elseIfConditions,
        { condition: ">", threshold: 0, color: "#000000" }
      ]);
      conditionalColorInputRefs.current.push(null); // Add new ref for the new condition
    }
  };

  const removeElseIfCondition = () => {
    if (elseIfConditions.length > 0) {
      const updatedConditions = [...elseIfConditions];
      updatedConditions.pop();
      setElseIfConditions(updatedConditions);
      conditionalColorInputRefs.current.pop(); // Remove the ref for the removed condition
    }
  };

  const handleRightClick = (event: React.MouseEvent) => {
    event.preventDefault();
    setShowSettings(!showSettings);
  };

  const handleToggleChange = () => {
    setDisableConditions(!disableConditions);
  };

  const handleColorChange = (color: string, setColor: React.Dispatch<React.SetStateAction<string>>) => {
    setColor(color);
  };

  const openColorPicker = (ref: HTMLInputElement | null) => {
    if (ref) {
      ref.click();
    }
  };

  const handleElseIfColorChange = (index: number, color: string) => {
    const updatedConditions = [...elseIfConditions];
    updatedConditions[index].color = color;
    setElseIfConditions(updatedConditions);
  };

  const getConditionLabel = (value: number) => {
    for (const cond of conditionalFormatting) {
      const { operator, value: threshold } = cond;
      if (checkCondition(value, operator, threshold)) {
        if (checkCondition(value, ">", threshold)) return "High";
        if (checkCondition(value, "<", threshold)) return "Low";
        if (checkCondition(value, "=", threshold) || checkCondition(value, ">=", threshold) || checkCondition(value, "<=", threshold)) return "Med";
      }
    }
    return "None";
  };

  return (
    <div onContextMenu={handleRightClick} style={{ position: 'relative', padding: '20px' }}>
      <div style={{ 
        width: '200px',  // Adjusted width for spacing
        height: '140px',  // Adjusted height for spacing
        backgroundColor: parseColor(interiorColor, interiorOpacity), 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center', 
        borderRadius: `${borderRadius}px`,
        border: `${borderThickness}px solid ${parseColor(borderColor, borderOpacity)}`,
        cursor: 'pointer',
        position: 'relative' // Ensure the absolute positioning of the inner elements is relative to this container
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          width: '100%', 
          position: 'absolute', 
          top: '5px', 
          left: '0px',  // Positioned 5px from the left border
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
          <div>
          </div>
        </div>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          alignItems: 'flex-end', 
          width: '100%', 
          padding: '10px',
          paddingRight: '20px'  // Added 10px spacing to the right
        }}>
          <span style={{ color: titleColor, fontSize: '14px', marginBottom: '5px' }}>{title}</span>
          <span style={{ color: getValueColor(value), fontSize: '24pt' }}>{formatValue(value)}</span>
        </div>
      </div>

      {showSettings && (
        <div style={{ 
          position: 'absolute', 
          top: '0', 
          left: '220px',  // Moved 50px to the right
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '10px', 
          boxShadow: '0 0 10px rgba(0,0,0,0.1)',
          width: '400px' 
        }}>
          <div style={{ marginBottom: '10px', textAlign: 'right' }}>
            <label style={{ marginRight: '10px' }}>Disable Conditions:</label>
            <input type="checkbox" checked={disableConditions} onChange={handleToggleChange} />
          </div>

          <div style={{ marginBottom: '20px', textAlign: 'right', display: 'flex', alignItems: 'center' }}>
            <span>If Value</span>
            <select 
              value={condition} 
              onChange={(e) => setCondition(e.target.value)} 
              style={{
                width: '55px',
                height: '30px',
                borderRadius: '15px',
                border: '2px solid darkgrey',
                padding: '0 10px',
                marginLeft: '10px',
                marginRight: '10px'
              }}>
              <option value=">">&gt;</option>
              <option value="<">&lt;</option>
              <option value="=">=</option>
              <option value=">=">&gt;=</option>
              <option value="<=">&lt;=</option>
            </select>
            <input 
              type="number" 
              value={threshold} 
              onChange={(e) => setThreshold(Number(e.target.value))} 
              style={{
                height: '30px',
                borderRadius: '15px',
                border: '2px solid darkgrey',
                padding: '0 10px',
                marginRight: '10px',
                flexGrow: 1
              }}
            />
          </div>

          <div style={{ marginBottom: '20px', textAlign: 'right', display: 'flex', alignItems: 'center' }}>
            <span>then color =</span>
            <div 
              onClick={() => openColorPicker(colorInputRef.current)}
              style={{ 
                height: '30px', 
                width: '30px', 
                borderRadius: '50%', 
                border: '2px solid darkgrey', 
                backgroundColor: conditionalColor,
                marginLeft: '10px',
                cursor: 'pointer'
              }}
            />
            <input 
              type="color" 
              ref={colorInputRef}
              value={conditionalColor} 
              onChange={(e) => handleColorChange(e.target.value, setConditionalColor)} 
              style={{ display: 'none' }}
            />
          </div>

          {showElseIf && elseIfConditions.map((cond, index) => (
            <React.Fragment key={index}>
              <div style={{ height: '2px', backgroundColor: 'gray', borderRadius: '1px', margin: '20px 10px' }}></div>
              <div style={{ marginBottom: '20px', textAlign: 'right', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                  <span>Else If Value</span>
                  <select 
                    value={cond.condition} 
                    onChange={(e) => {
                      const updatedConditions = [...elseIfConditions];
                      updatedConditions[index].condition = e.target.value;
                      setElseIfConditions(updatedConditions);
                    }} 
                    style={{
                      width: '55px',
                      height: '30px',
                      borderRadius: '15px',
                      border: '2px solid darkgrey',
                      padding: '0 10px',
                      marginLeft: '10px',
                      marginRight: '10px'
                    }}>
                    <option value=">">&gt;</option>
                    <option value="<">&lt;</option>
                    <option value="=">=</option>
                    <option value=">=">&gt;=</option>
                    <option value="<=">&lt;=</option>
                  </select>
                  <input 
                    type="number" 
                    value={cond.threshold} 
                    onChange={(e) => {
                      const updatedConditions = [...elseIfConditions];
                      updatedConditions[index].threshold = Number(e.target.value);
                      setElseIfConditions(updatedConditions);
                    }} 
                    style={{
                      height: '30px',
                      borderRadius: '15px',
                      border: '2px solid darkgrey',
                      padding: '0 10px',
                      marginRight: '10px',
                      flexGrow: 1
                    }}
                  />
                  {index === elseIfConditions.length - 1 && (
                    <button 
                      onClick={removeElseIfCondition} 
                      style={{
                        height: '30px',
                        width: '30px',
                        fontSize: '24px',
                        border: '2px solid red',
                        borderRadius: '50%',
                        backgroundColor: 'white',
                        color: 'red',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                      -
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span>then color =</span>
                  <div 
                    onClick={() => openColorPicker(conditionalColorInputRefs.current[index])}
                    style={{ 
                      height: '30px', 
                      width: '30px', 
                      borderRadius: '50%', 
                      border: '2px solid darkgrey', 
                      backgroundColor: cond.color,
                      marginLeft: '10px',
                      cursor: 'pointer'
                    }}
                  />
                  <input 
                    type="color" 
                    ref={(el) => (conditionalColorInputRefs.current[index] = el)}
                    value={cond.color} 
                    onChange={(e) => handleElseIfColorChange(index, e.target.value)} 
                    style={{ display: 'none' }}
                  />
                </div>
              </div>
            </React.Fragment>
          ))}

          <div style={{ height: '2px', backgroundColor: 'gray', borderRadius: '1px', margin: '20px 10px' }}></div>

          <div style={{ marginBottom: '20px', textAlign: 'right', display: 'flex', alignItems: 'center' }}>
            <span>Else color =</span>
            <div 
              onClick={() => openColorPicker(elseColorInputRef.current)}
              style={{ 
                height: '30px', 
                width: '30px', 
                borderRadius: '50%', 
                border: '2px solid darkgrey', 
                backgroundColor: elseColor,
                marginLeft: '10px',
                cursor: 'pointer'
              }}
            />
            <input 
              type="color" 
              ref={elseColorInputRef}
              value={elseColor} 
              onChange={(e) => setElseColor(e.target.value)} 
              style={{ display: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            {!showElseIf && (
              <button 
                onClick={() => setShowElseIf(true)} 
                style={{ 
                  marginTop: '10px', 
                  height: '45px', 
                  padding: '0 20px',
                  fontSize: '12px',
                  border: '2px solid darkgrey',
                  borderRadius: '22.5px',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}>
                Add Condition
              </button>
            )}

            {showElseIf && elseIfConditions.length < 5 && (
              <button 
                onClick={addElseIfCondition} 
                style={{ 
                  marginTop: '10px', 
                  height: '45px', 
                  padding: '0 20px',
                  fontSize: '12px',
                  border: '2px solid darkgrey',
                  borderRadius: '22.5px',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}>
                Add Condition
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InfoCards;
