import React, { CSSProperties, useEffect, useState } from 'react';
import {
  AppliedPrompts,
  Context,
  onDrillDownFunction,
  ResponseData,
  TContext
} from '@incorta-org/component-sdk';
import IconPicker from './IconPicker';
import './styles.less';

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
  // @ts-ignore
  const isDashboardView = !!context.app.dashboardViewMode;

  const settings = context?.component?.settings;
  const breakByTrayItems = context?.component?.bindings?.["tray-key-dim"] || [];

  const interiorColor = settings?.containerColor || "transparent";
  const interiorOpacity = settings?.containerOpacity ? settings.containerOpacity / 100 : 1;
  const borderColor = settings?.borderColor || "#000000";
  const borderOpacity = settings?.borderOpacity ? settings.borderOpacity / 100 : 1;
  const borderThickness = settings?.borderThickness || 1;
  const borderRadius = settings?.borderRadius || 10;
  const defaultTitle = settings?.title || "Data";
  const titleColor = settings?.titleColor || "#FFFFFF";
  const valueColor = settings?.valueColor || "#FFFFFF";

  const titleFontWeight = settings?.titleFontWeight || "400";
  const valueFontWeight = settings?.valueFontWeight || "400";

  const titleFontSize = settings?.titleFontSize || 14;
  const valueFontSize = settings?.valueFontSize || 24;

  const alignment = settings?.textAlignment || "left";

  const horizontalSpacing = settings?.horizontalSpacing || 10;
  const verticalSpacing = settings?.verticalSpacing || 10;

  const paddingTop = settings?.paddingTop || 0;
  const paddingRight = settings?.paddingRight || 0;
  const paddingBottom = settings?.paddingBottom || 0;
  const paddingLeft = settings?.paddingLeft || 0;
  const cardInternalPadding = settings?.cardInternalPadding || 0;

  const iconSize = settings?.iconSize || 24;
  const iconPosition = settings?.iconPosition || "right";
  const iconPaddingAll = settings?.iconPaddingAll || 0;
  const iconPaddingTop = settings?.iconPaddingTop || 0;
  const iconPaddingRight = settings?.iconPaddingRight || 0;
  const iconPaddingBottom = settings?.iconPaddingBottom || 0;
  const iconPaddingLeft = settings?.iconPaddingLeft || 0;

  const conditionLabelPosition = settings?.conditionLabelPosition || "top-left";
  const conditionLabelSpacing = settings?.conditionLabelSpacing || 0;

  const [lists, setLists] = useState<number[][]>([]);
  const [titles, setTitles] = useState<string[]>([]);
  const [conditions, setConditions] = useState<Condition[][]>([]);
  const [groupLabels, setGroupLabels] = useState<string[]>([]);
  const [values, setValues] = useState<number[]>([]);
  const [icons, setIcons] = useState<IconSettings[]>(Array(50).fill({ icon: '', color: '#000000' }));

  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [iconPickerVisible, setIconPickerVisible] = useState(false);
  const [pickerLeftPosition, setPickerLeftPosition] = useState<number>(0);
  const [currentColor, setCurrentColor] = useState<string>('#000000');

  const fetchData = () => {
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
    } else if (breakByTrayItems.length === 0) {
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
  };

  useEffect(() => {
    fetchData();
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
    setPickerLeftPosition(event.currentTarget.getBoundingClientRect().left);
    setCurrentColor(icons[index].color);
    setIconPickerVisible(true);
  };

  const handleIconPick = (icon: string, color: string) => {
    if (selectedCardIndex !== null) {
      const newIcons = [...icons];
      newIcons[selectedCardIndex] = { icon, color }; // Ensure the icon and color are updated correctly
      setIcons(newIcons);
      setIconPickerVisible(false);
      setSelectedCardIndex(null);
    }
  };

  const handleColorChange = (color: string) => {
    if (selectedCardIndex !== null) {
      setCurrentColor(color); // Update the color in the state
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

  const getIconAndTextContainerStyle = (): CSSProperties => {
    switch (iconPosition) {
      case "top":
        return { display: "flex", flexDirection: "column", alignItems: "center" };
      case "bottom":
        return { display: "flex", flexDirection: "column-reverse", alignItems: "center" };
      case "left":
        return { display: "flex", flexDirection: "row", alignItems: "center" };
      case "right":
        return { display: "flex", flexDirection: "row-reverse", alignItems: "center" };
      default:
        return { display: "flex", flexDirection: "row-reverse", alignItems: "center" };
    }
  };

  const getIconStyle = (): CSSProperties => {
    if (iconPaddingAll !== 0) {
      return {
        fontSize: `${iconSize}px`,
        padding: `${iconPaddingAll}px`,
        cursor: 'pointer',
        color: icons[selectedCardIndex ?? 0]?.color, // Apply the selected color to the icon
      };
    }
    return {
      fontSize: `${iconSize}px`,
      paddingTop: `${iconPaddingTop}px`,
      paddingRight: `${iconPaddingRight}px`,
      paddingBottom: `${iconPaddingBottom}px`,
      paddingLeft: `${iconPaddingLeft}px`,
      cursor: 'pointer',
      color: icons[selectedCardIndex ?? 0]?.color, // Apply the selected color to the icon
    };
  };

  const getCardPaddingStyle = (): CSSProperties => {
    if (cardInternalPadding !== 0) {
      return {
        padding: `${cardInternalPadding}px`,
      };
    }
    return {
      paddingTop: `${paddingTop}px`,
      paddingRight: `${paddingRight}px`,
      paddingBottom: `${paddingBottom}px`,
      paddingLeft: `${paddingLeft}px`,
    };
  };

  const getConditionLabelPositionStyle = (): CSSProperties => {
    const spacing = `${conditionLabelSpacing}px`;
    switch (conditionLabelPosition) {
      case "top-left":
        return {
          top: spacing,
          left: spacing,
          height: '20px',
          position: 'absolute',
        };
      case "top-right":
        return {
          top: spacing,
          right: spacing,
          height: '20px',
          position: 'absolute',
        };
      case "bottom-left":
        return {
          bottom: spacing,
          left: spacing,
          height: '20px',
          position: 'absolute',
        };
      case "bottom-right":
        return {
          bottom: spacing,
          right: spacing,
          height: '20px',
          position: 'absolute',
        };
      default:
        return {
          top: spacing,
          left: spacing,
          height: '20px',
          position: 'absolute',
        };
    }
  };

  const handlePlaceholderClick = (index: number) => {
    setSelectedCardIndex(index);
    setIconPickerVisible(true);
  };

  const renderGroupedCards = () => (
    <div className="info-cards-container">
      {groupLabels.map((groupLabel, indexGroup) => (
        <React.Fragment key={indexGroup}>
          {groupLabel && <div className="group-label">{groupLabel}</div>}
          <div
            className="grouped-cards"
            style={{
              gap: `${horizontalSpacing}px`,
            }}
          >
            {lists.map((list, listIndex) => {
              if (indexGroup >= list.length) return null;
              const value = list[indexGroup];
              const formattedValue = formatNumber(value);
              const conditionLabel = getConditionLabel(value, listIndex);
              const title = titles[listIndex] || defaultTitle;
              const { icon, color } = icons[listIndex];

              return (
                <div
                  key={`${listIndex}-${indexGroup}`}
                  className="card"
                  style={{
                    backgroundColor: parseColor(interiorColor, interiorOpacity),
                    borderRadius: `${borderRadius}px`,
                    border: `${borderThickness}px solid ${parseColor(borderColor, borderOpacity)}`,
                    marginBottom: `${verticalSpacing}px`,
                    ...getCardPaddingStyle(),
                    position: 'relative',
                  }}
                >
                  <div style={getIconAndTextContainerStyle()}>
                    {icon && (
                      <div onClick={() => !isDashboardView && handlePlaceholderClick(listIndex)}>
                        <span className="material-icons" style={{ ...getIconStyle(), color: color }}>
                          {icon}
                        </span>
                      </div>
                    )}
                    {!isDashboardView && !icon && (
                      <div
                        className="icon-placeholder"
                        onClick={() => handlePlaceholderClick(listIndex)}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          alignItems: "center",
                          width: "80px",
                          height: "80px",
                          border: "2px dashed #ccc",
                          borderRadius: "8px",
                          cursor: "pointer",
                          margin:
                            iconPosition === "right"
                              ? "0 0 0 30px"
                              : iconPosition === "left"
                              ? "0 30px 0 0"
                              : iconPosition === "top"
                              ? "0 0 30px 0"
                              : "30px 0 0 0",
                          minWidth: "80px",
                          minHeight: "80px",
                        }}
                      >
                        <span className="material-icons" style={{ color: "#ccc", fontSize: "24px" }}>
                          add
                        </span>
                        <span style={{ color: "#666", fontSize: "12px", textAlign: "center" }}>Add Icon</span>
                      </div>
                    )}
                    <div
                      className="card-content"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: alignment === 'center' ? 'center' : alignment === 'right' ? 'flex-end' : 'flex-start',
                      }}
                    >
                      {conditionLabel && (
                        <div className="condition-label-container" style={getConditionLabelPositionStyle()}>
                          <div
                            className="condition-label"
                            style={{
                              backgroundColor: getValueColor(value, listIndex),
                              padding: '5px',
                              borderRadius: `${borderRadius}px`,
                              color: getValueColor(value, listIndex) === '#FFFFFF' ? '#000000' : '#FFFFFF',
                              whiteSpace: 'nowrap',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            {conditionLabel}
                          </div>
                        </div>
                      )}
                      <span
                        className="card-title"
                        style={{
                          color: titleColor,
                          fontWeight: titleFontWeight,
                          fontSize: `${titleFontSize}px`,
                          textAlign: alignment,
                        }}
                      >
                        {title}
                      </span>
                      <span
                        className="card-value"
                        style={{
                          color: getValueColor(value, listIndex),
                          fontWeight: valueFontWeight,
                          fontSize: `${valueFontSize}px`,
                          textAlign: alignment,
                        }}
                      >
                        {formattedValue}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </React.Fragment>
      ))}
    </div>
  );

  const renderIndividualCards = () => (
    <div
      className="grouped-cards"
      style={{
        gap: `${horizontalSpacing}px`,
      }}
    >
      {values.filter(value => value !== 0).map((value, index) => {
        const formattedValue = formatNumber(value);
        const conditionLabel = getConditionLabel(value, index);
        const title = titles[index] || defaultTitle;
        const { icon, color } = icons[index];

        return (
          <div
            key={index}
            className="card"
            style={{
              backgroundColor: parseColor(interiorColor, interiorOpacity),
              borderRadius: `${borderRadius}px`,
              border: `${borderThickness}px solid ${parseColor(borderColor, borderOpacity)}`,
              marginBottom: `${verticalSpacing}px`,
              ...getCardPaddingStyle(),
              position: 'relative',
            }}
          >
            <div style={getIconAndTextContainerStyle()}>
              {icon && (
                <div onClick={() => !isDashboardView && handlePlaceholderClick(index)}>
                  <span className="material-icons" style={{ ...getIconStyle(), color: color }}>
                    {icon}
                  </span>
                </div>
              )}
              {!isDashboardView && !icon && (
                <div
                  className="icon-placeholder"
                  onClick={() => handlePlaceholderClick(index)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    width: "80px",
                    height: "80px",
                    border: "2px dashed #ccc",
                    borderRadius: "8px",
                    cursor: "pointer",
                  }}
                >
                  <span className="material-icons" style={{ color: "#ccc", fontSize: "24px" }}>add</span>
                  <span style={{ color: "#666", fontSize: "12px" }}>Add Icon</span>
                </div>
              )}
              <div
                className="card-content"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: alignment === 'center' ? 'center' : alignment === 'right' ? 'flex-end' : 'flex-start',
                }}
              >
                {conditionLabel && (
                  <div className="condition-label-container" style={getConditionLabelPositionStyle()}>
                    <div
                      className="condition-label"
                      style={{
                        backgroundColor: getValueColor(value, index),
                        padding: '5px',
                        borderRadius: `${borderRadius}px`,
                        color: getValueColor(value, index) === '#FFFFFF' ? '#000000' : '#FFFFFF',
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {conditionLabel}
                    </div>
                  </div>
                )}
                <span
                  className="card-title"
                  style={{
                    color: titleColor,
                    fontWeight: titleFontWeight,
                    fontSize: `${titleFontSize}px`,
                    textAlign: alignment,
                  }}
                >
                  {title}
                </span>
                <span
                  className="card-value"
                  style={{
                    color: getValueColor(value, index),
                    fontWeight: valueFontWeight,
                    fontSize: `${valueFontSize}px`,
                    textAlign: alignment,
                  }}
                >
                  {formattedValue}
                </span>
              </div>
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
          onColorChange={handleColorChange}
          leftPosition={pickerLeftPosition}
          currentColor={currentColor}
          onRemoveIcon={handleRemoveIcon}
        />
      )}
    </>
  );
};

export default InfoCards;
