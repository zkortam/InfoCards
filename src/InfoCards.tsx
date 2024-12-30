import React, { useEffect, useState } from 'react';
import { AppliedPrompts, Context, onDrillDownFunction, ResponseData, TContext, usePrivateData, useContext, useQuery } from '@incorta-org/component-sdk';
import IconPicker from './IconPicker';
import {
  getDefaultSettings,
  parseColor,
  formatNumber,
  getConditionLabelPositionStyle,
  getIconAndTextContainerStyle,
  getCardPaddingStyle,
  calculateCardWidth,
  calculateGroupWidth,
  fetchData,
} from './utils';
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
  const isDashboardView = !!(context.app as any).dashboardViewMode;

  const { privateData, setPrivateData } = usePrivateData();
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [measureIcons, setMeasureIcons] = useState<{ [measure: string]: IconSettings }>(privateData?.measureIcons || {});
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [iconPickerVisible, setIconPickerVisible] = useState(false);
  const [pickerLeftPosition, setPickerLeftPosition] = useState<number>(0);
  const [currentColor, setCurrentColor] = useState<string>('#000000');
  const [lists, setLists] = useState<number[][]>([]);
  const [titles, setTitles] = useState<string[]>([]);
  const [conditions, setConditions] = useState<Condition[][]>([]);
  const [groupLabels, setGroupLabels] = useState<string[]>([]);
  const [values, setValues] = useState<number[]>([]);
  const [conditionalFormattingSettings, setConditionalFormattingSettings] = useState<any>({});

  //@ts-ignore - Ignore TypeScript error for conditionalFormattingDictionary
  const { data: queryData, context: queryContext, conditionalFormattingDictionary } = useQuery(
    useContext(),
    prompts
  );

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (conditionalFormattingDictionary) {
      setConditionalFormattingSettings(conditionalFormattingDictionary);
      console.log('Conditional Formatting Dictionary:', conditionalFormattingDictionary);
    }
  }, [conditionalFormattingDictionary]);

  useEffect(() => {
    fetchData(data, context, context?.component?.bindings?.['tray-key-dim'] || [], setGroupLabels, setLists, setTitles, setConditions, setValues);
  }, [data]);

  useEffect(() => {
    setPrivateData({ measureIcons });
  }, [measureIcons]);

  const settings = getDefaultSettings(context?.component?.settings);

  const handleCardRightClick = (groupIndex: number, cardIndex: number, event: React.MouseEvent) => {
    event.preventDefault();
    setSelectedCardIndex(cardIndex);
    setPickerLeftPosition(event.currentTarget.getBoundingClientRect().left);
    const selectedMeasure = titles[cardIndex];
    setCurrentColor(measureIcons[selectedMeasure]?.color || '#000000');
    setIconPickerVisible(true);
  };

  const handleIconPick = (icon: string, color: string) => {
    if (selectedCardIndex !== null) {
      const selectedMeasure = titles[selectedCardIndex];
      setMeasureIcons((prevIcons) => ({
        ...prevIcons,
        [selectedMeasure]: { icon, color },
      }));
      setIconPickerVisible(false);
      setSelectedCardIndex(null);
    }
  };

  const handleColorChange = (color: string) => {
    const parsedColor = color === "Transparent" ? "rgba(0,0,0,0)" : color === "Default" ? "#FFFFFF" : color;

    if (selectedCardIndex !== null) {
      const selectedMeasure = titles[selectedCardIndex];
      setMeasureIcons((prevIcons) => ({
        ...prevIcons,
        [selectedMeasure]: { icon: prevIcons[selectedMeasure]?.icon || '', color: parsedColor },
      }));
    }
  };

  const handleRemoveIcon = () => {
    if (selectedCardIndex !== null) {
      const selectedMeasure = titles[selectedCardIndex];
      setMeasureIcons((prevIcons) => ({
        ...prevIcons,
        [selectedMeasure]: { icon: '', color: '#000000' },
      }));
      setIconPickerVisible(false);
      setSelectedCardIndex(null);
    }
  };

  const handlePlaceholderClick = (groupIndex: number, cardIndex: number) => {
    setSelectedCardIndex(cardIndex);
    setIconPickerVisible(true);
  };

  const getFormattingForValue = (
    value: number,
    measureIndex: number,
    formattingArray: any[]
  ): { color: string; backgroundColor: string } => {
    // Fetch measureKey safely
    const measureKeys = Object.keys(conditionalFormattingSettings?.bindings?.['tray-key'] || {});
    const measureKey = measureKeys[measureIndex];

    // Fetch rules for the measureKey
    const rules = conditionalFormattingSettings?.settings?.[measureKey]?.rules;

    if (!rules || rules.length === 0) {
      return { color: settings.valueColor, backgroundColor: settings.interiorColor }; // Defaults
    }

    for (const rule of rules) {
      const threshold = parseFloat(rule.value);
      const operator = rule.operator;

      const matches =
        (operator === '<' && value < threshold) ||
        (operator === '<=' && value <= threshold) ||
        (operator === '>' && value > threshold) ||
        (operator === '>=' && value >= threshold) ||
        (operator === '=' && value === threshold);

      if (matches) {
        return {
          color: rule?.settingValue?.color || settings.valueColor,
          backgroundColor: rule?.settingValue?.backgroundColor || settings.interiorColor,
        };
      }
    }

    return { color: settings.valueColor, backgroundColor: settings.interiorColor }; // Defaults
  };

  const groupsPerRow = Math.floor(
    windowSize.width /
      calculateGroupWidth(
        calculateCardWidth(settings.paddingLeft, settings.paddingRight, settings.cardInternalPadding, settings.horizontalSpacing),
        settings.groupSpacing,
        lists.length / groupLabels.length
      )
  );

  const renderGroupedCards = () => {
    const totalGroups = groupLabels.length;
    const rows = [];

    for (let i = 0; i < totalGroups; i += groupsPerRow) {
      const groupsInRow = groupLabels.slice(i, i + groupsPerRow).map((groupLabel, indexGroup) => (
        <div
          className="group"
          key={`group-${indexGroup}`}
          style={{ display: 'inline-block', marginRight: `${settings.groupSpacing}px`, marginBottom: `${settings.groupSpacing}px` }}
        >
          {settings.showGroupLabels && groupLabel && (
            <div
              className="group-label"
              style={{
                fontSize: `${settings.groupTitleSize}px`,
                color: settings.groupTitleColor,
                marginBottom: `${settings.groupSpacing / 2}px`,
              }}
            >
              {groupLabel}
            </div>
          )}
          <div className="grouped-cards" style={{ gap: `${settings.horizontalSpacing}px` }}>
            {lists.map((list, listIndex) => {
              if (indexGroup >= list.length) return null;
              const value = list[indexGroup];
              const formattedValue = formatNumber(value);
              const formatting = getFormattingForValue(value, listIndex, []);
              const title = titles[listIndex] || settings.defaultTitle;
              const iconSettings = measureIcons[title] || { icon: '', color: '#000000' };

              return (
                <div
                  key={`${listIndex}-${indexGroup}`}
                  className="card"
                  style={{
                    backgroundColor: settings.interiorColor === "transparent"
                      ? "transparent"
                      : parseColor(settings.interiorColor, settings.interiorOpacity),
                    borderRadius: `${settings.borderRadius}px`,
                    border: settings.borderColor === "transparent"
                      ? "none"
                      : `${settings.borderThickness}px solid ${parseColor(settings.borderColor, settings.borderOpacity)}`,
                    marginBottom: `${settings.verticalSpacing}px`,
                    ...getCardPaddingStyle(
                      settings.paddingTop,
                      settings.paddingRight,
                      settings.paddingBottom,
                      settings.paddingLeft,
                      settings.cardInternalPadding
                    ),
                    position: 'relative',
                  }}
                >
                  <div style={getIconAndTextContainerStyle(settings.iconPosition)}>
                    {iconSettings.icon ? (
                      <div onClick={() => !isDashboardView && handlePlaceholderClick(indexGroup, listIndex)}>
                        <span
                          className="material-icons"
                          style={{
                            fontSize: `${settings.iconSize}px`,
                            color: iconSettings.color,
                            padding: settings.iconPaddingAll > 0
                              ? `${settings.iconPaddingAll}px`
                              : `${settings.iconPaddingTop}px ${settings.iconPaddingRight}px ${settings.iconPaddingBottom}px ${settings.iconPaddingLeft}px`,
                          }}
                        >
                          {iconSettings.icon}
                        </span>
                      </div>
                    ) : (
                      !isDashboardView && (
                        <div
                          className="icon-placeholder"
                          style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            border: '2px dashed #ccc',
                            padding: `${settings.iconPaddingAll}px`,
                            width: `${settings.iconSize}px`,
                            height: `${settings.iconSize}px`,
                            margin: `${settings.iconPaddingTop}px ${settings.iconPaddingRight}px ${settings.iconPaddingBottom}px ${settings.iconPaddingLeft}px`,
                            cursor: 'pointer',
                          }}
                          onClick={() => handlePlaceholderClick(indexGroup, listIndex)}
                        >
                          <span className="material-icons" style={{ fontSize: `${settings.iconSize / 2}px` }}>add</span>
                        </div>
                      )
                    )}
                    <div
                      className="card-content"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: settings.alignment === 'center' ? 'center' : settings.alignment === 'right' ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <span
                        className="card-title"
                        style={{
                          color: settings.titleColor,
                          fontWeight: settings.titleFontWeight,
                          fontSize: `${settings.titleFontSize}px`,
                        }}
                      >
                        {title}
                      </span>
                      <span
                        className="card-value"
                        style={{
                          color: formatting.color, // Dynamic text color
                          backgroundColor: formatting.backgroundColor, // Dynamic background color
                          fontWeight: settings.valueFontWeight,
                          fontSize: `${settings.valueFontSize}px`,
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
        </div>
      ));
      rows.push(
        <div className="row" key={`row-${i}`} style={{ display: 'flex', flexWrap: 'wrap' }}>
          {groupsInRow}
        </div>
      );
    }

    return <div className="info-cards-container">{rows}</div>;
  };

  const renderIndividualCards = () => (
    <div className="grouped-cards" style={{ gap: `${settings.horizontalSpacing}px` }}>
      {values.map((value, index) => {
        const formattedValue = formatNumber(value);
        const formatting = getFormattingForValue(value, index, []);
        const title = titles[index] || settings.defaultTitle;
        const iconSettings = measureIcons[title] || { icon: '', color: '#000000' };

        return (
          <div
            key={index}
            className="card"
            style={{
              backgroundColor: settings.interiorColor === "transparent"
                ? "transparent"
                : parseColor(settings.interiorColor, settings.interiorOpacity),
              borderRadius: `${settings.borderRadius}px`,
              border: settings.borderColor === "transparent"
                ? "none"
                : `${settings.borderThickness}px solid ${parseColor(settings.borderColor, settings.borderOpacity)}`,
              marginBottom: `${settings.verticalSpacing}px`,
              ...getCardPaddingStyle(
                settings.paddingTop,
                settings.paddingRight,
                settings.paddingBottom,
                settings.paddingLeft,
                settings.cardInternalPadding
              ),
              position: 'relative',
            }}
          >
            <div style={getIconAndTextContainerStyle(settings.iconPosition)}>
              {iconSettings.icon && (
                <div onClick={() => !isDashboardView && handlePlaceholderClick(0, index)}>
                  <span
                    className="material-icons"
                    style={{
                      fontSize: `${settings.iconSize}px`,
                      color: iconSettings.color,
                      padding: settings.iconPaddingAll > 0
                        ? `${settings.iconPaddingAll}px`
                        : `${settings.iconPaddingTop}px ${settings.iconPaddingRight}px ${settings.iconPaddingBottom}px ${settings.iconPaddingLeft}px`,
                    }}
                  >
                    {iconSettings.icon}
                  </span>
                </div>
              )}
              <div
                className="card-content"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: settings.alignment === 'center' ? 'center' : settings.alignment === 'right' ? 'flex-end' : 'flex-start',
                }}
              >
                <span
                  className="card-title"
                  style={{
                    color: settings.titleColor,
                    fontWeight: settings.titleFontWeight,
                    fontSize: `${settings.titleFontSize}px`,
                  }}
                >
                  {title}
                </span>
                <span
                  className="card-value"
                  style={{
                    color: formatting.color,
                    fontWeight: settings.valueFontWeight,
                    fontSize: `${settings.valueFontSize}px`,
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
      {context?.component?.bindings?.['tray-key-dim']?.length === 1 ? renderGroupedCards() : renderIndividualCards()}
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
