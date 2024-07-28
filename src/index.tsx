import React from 'react';
import {
  useContext,
  LoadingOverlay,
  ErrorOverlay,
  usePrompts,
  useQuery
} from '@incorta-org/component-sdk';
import InfoCards from './InfoCards';
import './styles.less';

// Load Google Fonts Icons Stylesheet
const link = document.createElement('link');
link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
link.rel = 'stylesheet';
document.head.appendChild(link);

export default () => {
  const { prompts, drillDown } = usePrompts();
  const { data, context, isLoading, isError, error } = useQuery(useContext(), prompts);
  return (
    <ErrorOverlay isError={isError} error={error}>
      <LoadingOverlay isLoading={isLoading} data={data}>
        {context && data ? (
          <InfoCards data={data} context={context} prompts={prompts} drillDown={drillDown} />
        ) : null}
      </LoadingOverlay>
    </ErrorOverlay>
  );
};
