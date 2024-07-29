import React, { useEffect, useState } from 'react';
import {
  AppliedPrompts,
  Context,
  onDrillDownFunction,
  ResponseData,
  TContext
} from '@incorta-org/component-sdk';
import IconPicker from './IconPicker';  // Import the IconPicker component

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

interface IconSettings {
  icon: string;
  color: string;
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
  const valueColor = settings?.valueColor || "#FFFFFF";
  const cardSpacing = settings?.cardSpacing || 10;

  const [lists, setLists] = useState<number[][]>([]);
  const [titles, setTitles] = useState<string[]>([]);
  const [conditions, setConditions] = useState<Condition[][]>([]);
  const [groupLabels, setGroupLabels] = useState<string[]>([]);
  const [values, setValues] = useState<number[]>([]);
  const [icons, setIcons] = useState<IconSettings[]>(Array(50).fill({ icon: '', color: '#000000' })); // Updated to store icon and color

  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [iconPickerVisible, setIconPickerVisible] = useState(false);
  const [pickerLeftPosition, setPickerLeftPosition] = useState<number>(0); // State to track left position of picker
  const [currentColor, setCurrentColor] = useState<string>('#000000'); // State to track current color

  useEffect(() => {
    if (breakByTrayItems.length === 1) {
      const dimensionLabels = data.data.map(row => row[0].value);
      setGroupLabels(dimensionLabels);

      const numberOfLists = Math.min(data.measureHeaders.length, 50);
      const initialLists: number[][] = Array.from({ length: numberOfLists }, (_, i) =>
        data.data.map(row => Number(row[i + 1].value))
      );

      initialLists.forEach((list, index) => {
        if (list.length === 0 || list.every(point => point === 0)) {
          initialLists[index] = Array(50).fill(0);
        }
      });

      setLists(initialLists.map(list => list.slice(0, 50)));

      const headers = data.measureHeaders.map(header => {
        const parts = header.label.split('.');
        return parts[parts.length - 1] || defaultTitle;
      });
      setTitles(headers.slice(0, 50));

      const extractedConditions = initialLists.map((_, index) => {
        const binding = (context?.component?.bindings?.["tray-key"]?.[index] as unknown as Binding);
        return binding?.settings?.conditions || [];
      });
      setConditions(extractedConditions);
    } else if (breakByTrayItems.length === 2) {
      if (data.data.length > 0) {
        const measureValues = data.data.map(row => row.map(item => item.value || 0));
        const numericValues = measureValues.flat().map(rawValue => typeof rawValue === 'string' ? parseFloat(rawValue) : rawValue);
        setValues(numericValues.slice(0, 10));

        const headers = data.measureHeaders.map(header => {
          const parts = header.label.split('.');
          return parts[parts.length - 1] || defaultTitle;
        });
        setTitles(headers.slice(0, 10));

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
    if (num >= 1e6 || num <= -1e6) return (num / 1e6).toFixed(3).replace(/\.?0+$/, '') + 'M';
    if (num >= 1e3 || num <= -1e3) return (num / 1e3).toFixed(3).replace(/\.?0+$/, '') + 'K';
    return num.toFixed(2).replace(/\.?0+$/, '');
  };

  const getConditionLabel = (value: number, index: number) => {
    const sortedConditions = conditions[index]?.sort((a, b) => parseFloat(a.value) - parseFloat(b.value)) || [];
    if (!sortedConditions.length) return null;

    let appliedColor = valueColor;

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

    if (numColors === 1) return "Med";
    if (numColors % 2 === 0) {
      if (indexColor < numColors / 2) return "Low";
      return "High";
    } else {
      const third = Math.floor(numColors / 3);
      if (indexColor < third) return "Low";
      if (indexColor >= third * 2) return "High";
      return "Med";
    }
  };

  const getValueColor = (value: number, index: number) => {
    const sortedConditions = conditions[index]?.sort((a, b) => parseFloat(a.value) - parseFloat(b.value)) || [];
    if (!sortedConditions.length) return valueColor;
    for (const condition of sortedConditions) {
      const threshold = parseFloat(condition.value);
      if (condition.op === '<' && value < threshold) return condition.color;
      if (condition.op === '>' && value > threshold) return condition.color;
      if (condition.op === '=' && value === threshold) return condition.color;
      if (condition.op === '<=' && value <= threshold) return condition.color;
      if (condition.op === '>=' && value >= threshold) return condition.color;
    }
    return valueColor;
  };

  const handleCardRightClick = (index: number, event: React.MouseEvent) => {
    event.preventDefault();
    setSelectedCardIndex(index);
    setPickerLeftPosition(event.currentTarget.getBoundingClientRect().left); // Calculate left position of the card
    setCurrentColor(icons[index].color); // Set the current color to the color of the selected icon
    setIconPickerVisible(true);
  };

  const handleIconPick = (icon: string, color: string) => {
    if (selectedCardIndex !== null) {
      const newIcons = [...icons];
      newIcons[selectedCardIndex] = { icon, color };
      setIcons(newIcons);
      setIconPickerVisible(false);
      setSelectedCardIndex(null);
    }
  };

  const handleColorChange = (color: string) => {
    if (selectedCardIndex !== null) {
      const newIcons = [...icons];
      if (newIcons[selectedCardIndex].icon) {
        newIcons[selectedCardIndex].color = color;
        setIcons(newIcons);
      }
    }
  };

  const handleRemoveIcon = () => {
    if (selectedCardIndex !== null) {
      const newIcons = [...icons];
      newIcons[selectedCardIndex] = { icon: '', color: '#000000' };
      setIcons(newIcons);
      setIconPickerVisible(false);
      setSelectedCardIndex(null);
    }
  };

  const calculateCardWidth = (title: string, value: number) => {
    const titleLength = title.length;
    const valueLength = formatNumber(value).length;
    const baseWidth = 30; // Reduced base width for padding and icon space
    const titleWidth = titleLength * 8; // Approximate width per character for title
    const valueWidth = valueLength * 14; // Approximate width per character for value
    return Math.min(baseWidth + titleWidth + valueWidth, 210); // Reduced maximum width
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
              if (indexGroup >= list.length) return null;
              const value = list[indexGroup];
              const formattedValue = formatNumber(value);
              const conditionLabel = getConditionLabel(value, listIndex);
              const title = titles[listIndex] || defaultTitle;
              const { icon, color } = icons[listIndex];
              const cardWidth = calculateCardWidth(title, value);

              return (
                <div
                  key={`${listIndex}-${indexGroup}`}
                  style={{
                    width: `${cardWidth}px`,
                    height: '130px', // Reduced height
                    backgroundColor: parseColor(interiorColor, interiorOpacity),
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderRadius: `${borderRadius}px`,
                    border: `${borderThickness}px solid ${parseColor(borderColor, borderOpacity)}`,
                    cursor: 'pointer',
                    position: 'relative',
                    padding: '0 10px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  onContextMenu={(e) => handleCardRightClick(listIndex, e)}
                >
                  {icon && (
                    <span className="material-icons" style={{ fontSize: '24px', marginBottom: '5px', color: color }}>
                      {icon}
                    </span>
                  )}
                  {conditionLabel && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'flex-start',
                      width: '100%',
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                    }}>
                      <div style={{
                        backgroundColor: getValueColor(value, listIndex),
                        borderRadius: `${borderRadius}px`,
                        padding: '5px 10px',
                        color: getValueColor(value, listIndex) === '#FFFFFF' ? '#000000' : '#FFFFFF', // Ensure text visibility
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
                    alignItems: conditionLabel ? 'flex-end' : 'center',
                    width: '100%',
                    textAlign: conditionLabel ? 'left' : 'center',
                    padding: conditionLabel ? '10px 20px 10px 10px' : '10px 5px',
                  }}>
                    <span style={{ color: titleColor, fontSize: '14px', marginBottom: '5px' }}>{title}</span>
                    <span style={{ color: getValueColor(value, listIndex), fontSize: '24pt', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{formattedValue}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ width: '100%', height: '20px' }}></div>
        </React.Fragment>
      ))}
    </div>
  );

  const renderIndividualCards = () => (
    <div style={{ display: 'flex', gap: `${cardSpacing}px`, flexWrap: 'wrap' }}>
      {values.filter(value => value !== 0).map((value, index) => {
        const formattedValue = formatNumber(value);
        const conditionLabel = getConditionLabel(value, index);
        const title = titles[index] || defaultTitle;
        const { icon, color } = icons[index];
        const cardWidth = calculateCardWidth(title, value);

        return (
          <div
            key={index}
            style={{
              width: `${cardWidth}px`,
              height: '130px', // Reduced height
              backgroundColor: parseColor(interiorColor, interiorOpacity),
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              borderRadius: `${borderRadius}px`,
              border: `${borderThickness}px solid ${parseColor(borderColor, borderOpacity)}`,
              cursor: 'pointer',
              position: 'relative',
              padding: '0 10px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            onContextMenu={(e) => handleCardRightClick(index, e)}
          >
            {icon && (
              <span className="material-icons" style={{ fontSize: '24px', marginBottom: '5px', color: color }}>
                {icon}
              </span>
            )}
            {conditionLabel && (
              <div style={{
                display: 'flex',
                justifyContent: 'flex-start',
                width: '100%',
                position: 'absolute',
                top: '10px',
                left: '10px',
              }}>
                <div style={{
                  backgroundColor: getValueColor(value, index),
                  borderRadius: `${borderRadius}px`,
                  padding: '5px 10px',
                  color: getValueColor(value, index) === '#FFFFFF' ? '#000000' : '#FFFFFF', // Ensure text visibility
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
              alignItems: conditionLabel ? 'flex-end' : 'center',
              width: '100%',
              textAlign: conditionLabel ? 'left' : 'center',
              padding: conditionLabel ? '10px 20px 10px 10px' : '10px 5px',
            }}>
              <span style={{ color: titleColor, fontSize: '14px', marginBottom: '5px' }}>{title}</span>
              <span style={{ color: getValueColor(value, index), fontSize: '24pt', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{formattedValue}</span>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      {breakByTrayItems.length === 1 ? renderGroupedCards() : renderIndividualCards()}
      {iconPickerVisible && (
        <IconPicker
          onPick={handleIconPick}
          onClose={() => setIconPickerVisible(false)}
          onColorChange={handleColorChange} // Pass the color change handler
          leftPosition={pickerLeftPosition} // Pass the left position of the picker
          currentColor={currentColor} // Pass the current color of the icon
          onRemoveIcon={handleRemoveIcon} // Pass the remove icon handler
        />
      )}
    </>
  );
};

export default InfoCards;
