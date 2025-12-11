import React, { FC } from 'react';
import { useIntl } from 'react-intl';

import {
  LocalVariable,
  LocalVariableCollection,
  VariableData,
  VariableResolvedDataType,
} from '../../types/variables';
import { formatVariableValue } from '../../utils/variables';

interface VariableDetailProps {
  variable: LocalVariable;
  collection: LocalVariableCollection;
  currentModeId: string;
  onModeChange: (modeId: string) => void;
}

const VariableDetail: FC<VariableDetailProps> = ({
  variable,
  collection,
  currentModeId,
  onModeChange,
}) => {
  const intl = useIntl();

  const modes = collection.modes.map((mode) => mode.modeId);
  const currentModeIndex = modes.indexOf(currentModeId);

  const handleModeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onModeChange(e.target.value);
  };

  const getCurrentValue = (): VariableData | undefined => {
    const value = variable.valuesByMode[currentModeId];
    if (!value) return undefined;

    // Reconstruct VariableData structure for formatVariableValue based on resolvedType
    if (typeof value === 'string' && variable.resolvedType === 'EXPRESSION') {
      // This is complex as expressions are not directly returned here.
      // For simplicity, we assume non-expression types for display if not explicitly using expression API.
      // In a real scenario, expression parsing would be needed.
      return {
        type: 'STRING',
        resolvedType: variable.resolvedType,
        value: value,
      } as VariableData;
    }

    return {
      type: variable.resolvedType,
      resolvedType: variable.resolvedType,
      value: value,
    } as VariableData;
  };

  const formattedValue = formatVariableValue(getCurrentValue());

  const variableType = variable.resolvedType;
  const isColor = variableType === 'COLOR';

  return (
    <div className="variable-detail">
      <div className="variable-detail__header">
        <h3 className="variable-detail__name">{variable.name}</h3>
        <select
          className="variable-detail__mode-select"
          value={currentModeId}
          onChange={handleModeSelect}
          aria-label={intl.formatMessage({
            id: 'variable.selectMode',
            defaultMessage: 'Select variable mode',
          })}
        >
          {collection.modes.map((mode) => (
            <option key={mode.modeId} value={mode.modeId}>
              {mode.name}
            </option>
          ))}
        </select>
      </div>

      <div className="variable-detail__body">
        <div className="variable-detail__row">
          <span className="variable-detail__label">
            {intl.formatMessage({ id: 'variable.type', defaultMessage: 'Type' })}:
          </span>
          <span className="variable-detail__value">
            {variableType.toLowerCase()}
          </span>
        </div>

        <div className="variable-detail__row">
          <span className="variable-detail__label">
            {intl.formatMessage({ id: 'variable.value', defaultMessage: 'Value' })}:
          </span>
          <div className={`variable-detail__value variable-detail__value--${variableType.toLowerCase()}`}>
            {isColor ? (
              <div
                className="variable-detail__color-preview"
                style={{ backgroundColor: formattedValue as string }}
              />
            ) : (
              <span>{formattedValue}</span>
            )}
          </div>
        </div>

        {variable.description && (
          <div className="variable-detail__row variable-detail__row--description">
            <span className="variable-detail__label">
              {intl.formatMessage({
                id: 'variable.description',
                defaultMessage: 'Description',
              })}:
            </span>
            <span className="variable-detail__value">
              {variable.description}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default VariableDetail;