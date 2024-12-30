import { CSSProperties } from 'react';
export interface IconSettings {
  icon: string;
  color: string;
}

export const getDefaultSettings = (settings: any) => ({
  interiorColor: settings?.containerColor || "transparent",
  interiorOpacity: settings?.containerOpacity ? settings.containerOpacity / 100 : 1,
  borderColor: settings?.borderColor || "#000000",
  borderOpacity: settings?.borderOpacity ? settings.borderOpacity / 100 : 1,
  borderThickness: settings?.borderThickness || 1,
  borderRadius: settings?.borderRadius || 10,
  defaultTitle: settings?.title || "Data",
  titleColor: settings?.titleColor || "#FFFFFF",
  valueColor: settings?.valueColor || "#FFFFFF",
  titleFontWeight: settings?.titleFontWeight || "400",
  valueFontWeight: settings?.valueFontWeight || "400",
  titleFontSize: settings?.titleFontSize || 14,
  valueFontSize: settings?.valueFontSize || 24,
  alignment: settings?.textAlignment || "left",
  horizontalSpacing: settings?.horizontalSpacing || 10,
  verticalSpacing: settings?.verticalSpacing || 10,
  groupSpacing: settings?.groupSpacing || 20,
  groupTitleSize: settings?.groupTitleSize || 16,
  groupTitleColor: settings?.groupTitleColor || "#000000",
  paddingTop: settings?.paddingTop || 0,
  paddingRight: settings?.paddingRight || 0,
  paddingBottom: settings?.paddingBottom || 0,
  paddingLeft: settings?.paddingLeft || 0,
  cardInternalPadding: settings?.cardInternalPadding || 0,
  iconSize: settings?.iconSize || 24,
  iconPosition: settings?.iconPosition || "right",
  iconPaddingAll: settings?.iconPaddingAll || 0,
  iconPaddingTop: settings?.iconPaddingTop || 0,
  iconPaddingRight: settings?.iconPaddingRight || 0,
  iconPaddingBottom: settings?.iconPaddingBottom || 0,
  iconPaddingLeft: settings?.iconPaddingLeft || 0,
  conditionLabelPosition: settings?.conditionLabelPosition || "top-left",
  conditionLabelSpacing: settings?.conditionLabelSpacing || 0,
  showGroupLabels: settings?.showGroupLabels !== undefined ? settings.showGroupLabels : true
});

export const parseColor = (color: string, opacity: number) => {
  const hex = color.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export const formatNumber = (num: number) => {
  if (num >= 1e6 || num <= -1e6)
    return (num / 1e6).toFixed(3).replace(/\.?0+$/, "") + "M";
  if (num >= 1e3 || num <= -1e3)
    return (num / 1e3).toFixed(3).replace(/\.?0+$/, "") + "K";
  return num.toFixed(2).replace(/\.?0+$/, "");
};

export const getConditionLabel = (
  value: number,
  conditionalFormatting: any,
  valueColor: string
): string | null => {
  if (!conditionalFormatting) return null;

  const { initialValue = {}, rules = [] } = conditionalFormatting;

  let appliedColor = initialValue?.color || valueColor;

  for (const rule of rules) {
    const threshold = parseFloat(rule.value);
    const operator = rule.operator;

    if (operator === "<" && value < threshold) {
      appliedColor = rule.settingValue?.color || appliedColor;
      break;
    }
    if (operator === ">" && value > threshold) {
      appliedColor = rule.settingValue?.color || appliedColor;
      break;
    }
    if (operator === "=" && value === threshold) {
      appliedColor = rule.settingValue?.color || appliedColor;
      break;
    }
    if (operator === "<=" && value <= threshold) {
      appliedColor = rule.settingValue?.color || appliedColor;
      break;
    }
    if (operator === ">=" && value >= threshold) {
      appliedColor = rule.settingValue?.color || appliedColor;
      break;
    }
  }


  const appliedIndex = rules.findIndex((rule: { settingValue: { color: any; }; }) => rule.settingValue.color === appliedColor);
  const numColors = rules.length;

  if (numColors === 1) return "Med";
  if (numColors % 2 === 0) {
    if (appliedIndex < numColors / 2) return "Low";
    return "High";
  } else {
    const third = Math.floor(numColors / 3);
    if (appliedIndex < third) return "Low";
    if (appliedIndex >= third * 2) return "High";
    return "Med";
  }
};

  export const getFormatting = (
    value: number,
    conditionalFormatting: any
  ): { color: string; backgroundColor: string } => {
    if (!conditionalFormatting) {
      return { color: "#000000", backgroundColor: "transparent" };
    }
  
    const { initialValue = {}, rules = [] } = conditionalFormatting; // Ensure safe defaults
  
    for (const rule of rules) {
      const threshold = parseFloat(rule.value);
      const operator = rule.operator;
  
      const matches =
        (operator === "<" && value < threshold) ||
        (operator === "<=" && value <= threshold) ||
        (operator === ">" && value > threshold) ||
        (operator === ">=" && value >= threshold) ||
        (operator === "=" && value === threshold);
  
      if (matches) {
        return {
          color: rule?.settingValue?.color || initialValue.color || "#000000",
          backgroundColor: rule?.settingValue?.backgroundColor || initialValue.backgroundColor || "transparent",
        };
      }
    }
  
    // Default formatting
    return {
      color: initialValue.color || "#000000",
      backgroundColor: initialValue.backgroundColor || "transparent",
    };
  };
  
  

export const getValueColor = (value: number, conditions: any[], valueColor: string) => {
  const sortedConditions = conditions?.sort((a, b) => parseFloat(a.value) - parseFloat(b.value)) || [];
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

export const calculateCardWidth = (paddingLeft: number, paddingRight: number, cardInternalPadding: number, horizontalSpacing: number) => {
  const cardContentWidth = 100; // Assume a base content width for each card
  const totalPadding = paddingLeft + paddingRight + 2 * cardInternalPadding;
  return cardContentWidth + totalPadding + horizontalSpacing;
};

export const calculateGroupWidth = (cardWidth: number, groupSpacing: number, measuresPerGroup: number) => {
  return cardWidth * measuresPerGroup + groupSpacing;
};

export const getConditionLabelPositionStyle = (
  conditionLabelPosition: string,
  conditionLabelSpacing: number
): CSSProperties => {
  const spacing = `${conditionLabelSpacing}px`;
  switch (conditionLabelPosition) {
    case 'top-left':
      return { top: spacing, left: spacing, height: '20px', position: 'absolute' as 'absolute' };
    case 'top-right':
      return { top: spacing, right: spacing, height: '20px', position: 'absolute' as 'absolute' };
    case 'bottom-left':
      return { bottom: spacing, left: spacing, height: '20px', position: 'absolute' as 'absolute' };
    case 'bottom-right':
      return { bottom: spacing, right: spacing, height: '20px', position: 'absolute' as 'absolute' };
    default:
      return { top: spacing, left: spacing, height: '20px', position: 'absolute' as 'absolute' };
  }
};

export const getIconAndTextContainerStyle = (iconPosition: string): React.CSSProperties => {
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

export const getCardPaddingStyle = (paddingTop: number, paddingRight: number, paddingBottom: number, paddingLeft: number, cardInternalPadding: number): React.CSSProperties => {
  if (cardInternalPadding !== 0) {
    return { padding: `${cardInternalPadding}px` };
  }
  return { paddingTop: `${paddingTop}px`, paddingRight: `${paddingRight}px`, paddingBottom: `${paddingBottom}px`, paddingLeft: `${paddingLeft}px` };
};

export const fetchData = (
    data: any,
    context: any,
    breakByTrayItems: any[],
    setGroupLabels: Function,
    setLists: Function,
    setTitles: Function,
    setConditions: Function,
    setValues: Function
  ) => {
    if (breakByTrayItems.length === 1) {
      const dimensionLabels = data.data.map((row: any) => row[0]?.value || "N/A");
      setGroupLabels(dimensionLabels);
  
      const numberOfLists = Math.min(data.measureHeaders.length, 50);
      const initialLists: number[][] = Array.from({ length: numberOfLists }, (_, i) =>
        data.data.map((row: any) => Number(row[i + 1]?.value || 0))
      );
  
      setLists(initialLists.map((list) => list.slice(0, 50)));
  
      const headers = data.measureHeaders.map((header: any) => {
        const parts = header.label.split(".");
        return parts[parts.length - 1] || "Data";
      });
      setTitles(headers.slice(0, 50));
  
      const extractedConditions = initialLists.map((_, index) => {
        const binding = context?.component?.bindings?.["tray-key"]?.[index];
        return binding?.settings?.conditions || [];
      });
      setConditions(extractedConditions);
    } else if (breakByTrayItems.length === 0) {
      const measureValues = data.data.map((row: any) =>
        row.map((item: any) => item?.value || 0)
      );
      const numericValues = measureValues
        .flat()
        .map((rawValue: any) =>
          typeof rawValue === "string" ? parseFloat(rawValue) : rawValue
        );
      setValues(numericValues.slice(0, 10));
  
      const headers = data.measureHeaders.map((header: any) => {
        const parts = header.label.split(".");
        return parts[parts.length - 1] || "Data";
      });
      setTitles(headers.slice(0, 10));
  
      const extractedConditions = numericValues.map((_: any, index: string | number) => {
        const binding = context?.component?.bindings?.["tray-key"]?.[index];
        return binding?.settings?.conditions || [];
      });
      setConditions(extractedConditions);
    }
  };  

  const applyConditionalFormatting = (
    value: number,
    measureIndex: number,
    conditionalFormattingDictionary: any
  ): { color: string; backgroundColor: string } => {
    if (!conditionalFormattingDictionary) {
      return { color: "#000000", backgroundColor: "transparent" };
    }
  
    const measureKeys = Object.keys(conditionalFormattingDictionary?.bindings?.["2"] || {});
    const measureKey = measureKeys[measureIndex];
  
    if (!measureKey) return { color: "#000000", backgroundColor: "transparent" };
  
    const rules = conditionalFormattingDictionary?.settings?.[measureKey]?.rules;
  
    if (!rules || rules.length === 0) {
      return { color: "#000000", backgroundColor: "transparent" };
    }
  
    for (const rule of rules) {
      const threshold = parseFloat(rule.value);
      const operator = rule.operator;
  
      const matches =
        (operator === "<" && value < threshold) ||
        (operator === "<=" && value <= threshold) ||
        (operator === ">" && value > threshold) ||
        (operator === ">=" && value >= threshold) ||
        (operator === "=" && value === threshold);
  
      if (matches) {
        return {
          color: rule.settingValue.color || "#000000",
          backgroundColor: rule.settingValue.backgroundColor || "transparent",
        };
      }
    }
  
    return { color: "#000000", backgroundColor: "transparent" };
  };
  
