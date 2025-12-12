import React, { useState, useCallback } from 'react';
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  LocalVariableCollection,
  LocalVariable,
  PublishedVariableCollection,
  PublishedVariable,
  VariableScope,
  VariableResolvedDataType,
} from '../../../types/figma';

// Helper types derived from OpenAPI schemas where necessary for clarity
// These types map to the structure expected from the API responses for variables
interface VariableItem {
  id: string;
  name: string;
  key: string;
  remote: boolean;
  description: string;
  variableCollectionId?: string; // For LocalVariable
  subscribed_id?: string; // For PublishedVariable
  updatedAt?: string; // For PublishedVariable
  codeSyntax?: any; // Simplified
  scopes?: VariableScope[]; // Simplified
  resolvedType?: VariableResolvedDataType; // Simplified
  valuesByMode?: { [modeId: string]: any }; // Simplified values
  variableCollectionKey?: string; // For PublishedVariable (inferred/mocked)
}

interface VariableCatalogProps {
  localVariables: {
    variables: { [id: string]: LocalVariable };
    collections: { [id: string]: LocalVariableCollection };
  };
  publishedVariables: {
    variables: { [id: string]: PublishedVariable };
    collections: { [id: string]: PublishedVariableCollection };
  };
}

// --- UI Components ---

interface VariableCollectionItemProps {
  collection: LocalVariableCollection | PublishedVariableCollection;
  variables: VariableItem[];
  isPublished: boolean;
  onSelectVariable: (variableId: string, collectionId: string) => void;
}

const VariableCollectionItem: React.FC<VariableCollectionItemProps> = ({
  collection,
  variables,
  isPublished,
  onSelectVariable,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedVariableId, setSelectedVariableId] = useState<string | null>(
    null,
  );

  const handleCollectionToggle = () => {
    setIsExpanded(!isExpanded);
    setSelectedVariableId(null); // Collapse variables when collapsing collection
  };

  const handleVariableSelect = (variableId: string) => {
    setSelectedVariableId(prevId =>
      prevId === variableId ? null : variableId,
    );
    onSelectVariable(
      variableId,
      collection.id || (collection as LocalVariableCollection).key,
    );
  };

  const collectionIdKey = isPublished
    ? (collection as PublishedVariableCollection).subscribed_id
    : (collection as LocalVariableCollection).id;

  const collectionVariables = variables.filter(v =>
    isPublished
      ? v.variableCollectionId === collectionIdKey
      : v.variableCollectionId === collectionIdKey,
  );

  const collectionName = collection.name || 'Unknown Collection';

  return (
    <View style={styles.collectionContainer}>
      <TouchableOpacity onPress={handleCollectionToggle} style={styles.header}>
        <Text style={styles.collectionNameText}>
          {collectionName}
          {isPublished ? ' (Published)' : ' (Local)'} ({collectionVariables.length})
        </Text>
        <Text>{isExpanded ? 'â²' : 'â¼'}</Text>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.variablesList}>
          {collectionVariables.map(variable => (
            <View key={variable.id}>
              <TouchableOpacity
                onPress={() => handleVariableSelect(variable.id)}
                style={[
                  styles.variableRow,
                  selectedVariableId === variable.id && styles.selectedVariableRow,
                ]}
              >
                <Text style={styles.variableNameText}>
                  {variable.name} ({variable.resolvedType || 'N/A'})
                </Text>
              </TouchableOpacity>

              {selectedVariableId === variable.id && (
                <VariableDetails variable={variable} isPublished={isPublished} />
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

interface VariableDetailsProps {
  variable: VariableItem;
  isPublished: boolean;
}

const VariableDetails: React.FC<VariableDetailsProps> = ({ variable, isPublished }) => {
  const [showValues, setShowValues] = useState(false);

  const renderModeValues = () => {
    if (!variable.valuesByMode) return null;

    const modeIds = Object.keys(variable.valuesByMode);
    const collection = isPublished
      ? { modes: [] } // Mock for simplicity, real implementation needs collection data
      : { modes: (variable as LocalVariable).modes }; // Assuming LocalVariable has modes structure if needed

    return (
      <View style={styles.detailsSection}>
        <Text style={styles.detailSubtitle}>Values by Mode:</Text>
        <TouchableOpacity onPress={() => setShowValues(!showValues)}>
          <Text style={styles.showValuesText}>
            {showValues ? 'Hide Values' : 'Show Values'}
          </Text>
        </TouchableOpacity>
        {showValues && (
          <View style={styles.modeValuesList}>
            {modeIds.map(modeId => {
              let value = variable.valuesByMode?.[modeId];
              // Basic value formatting
              if (typeof value === 'object' && value !== null) {
                if (value.type === 'VARIABLE_ALIAS') {
                  value = `Alias: ${value.id}`;
                } else if (value.r !== undefined) {
                  // Color
                  value = `RGBA(${Math.round(value.r * 255)}, ${Math.round(
                    value.g * 255,
                  )}, ${Math.round(value.b * 255)}, ${value.a.toFixed(2)})`;
                } else {
                  value = JSON.stringify(value);
                }
              }

              // TODO: Better mode name retrieval based on modeId for Local vs Published
              return (
                <Text key={modeId} style={styles.modeValueText}>
                  Mode ({modeId.substring(0, 8)}...): {String(value).substring(0, 50)}
                </Text>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.detailsBox}>
      <Text style={styles.detailLabel}>ID: {variable.id.substring(0, 8)}...</Text>
      <Text style={styles.detailLabel}>
        Description: {variable.description.substring(0, 100)}...
      </Text>
      {variable.scopes && variable.scopes.length > 0 && (
        <Text style={styles.detailLabel}>
          Scopes: {variable.scopes.join(', ')}
        </Text>
      )}
      {renderModeValues()}
    </View>
  );
};

// --- Main Component ---

const VariableCatalog: React.FC<VariableCatalogProps> = ({
  localVariables,
  publishedVariables,
}) => {
  const [activeTab, setActiveTab] = useState<'local' | 'published'>('local');
  const [selectedVariable, setSelectedVariable] = useState<{
    name: string;
    collectionName: string;
    type: VariableResolvedDataType | string;
    collectionId: string;
    id: string;
  } | null>(null);

  const handleVariableSelect = useCallback(
    (variableId: string, collectionId: string) => {
      const source = activeTab === 'local' ? localVariables : publishedVariables;
      const variable = source.variables[variableId];

      if (variable) {
        const collection = source.collections[variable.variableCollectionId];
        setSelectedVariable({
          name: variable.name,
          collectionName: collection?.name || 'N/A',
          type: variable.resolvedType || 'N/A',
          collectionId: collectionId,
          id: variableId,
        });
      } else {
        setSelectedVariable(null);
      }
    },
    [activeTab, localVariables, publishedVariables],
  );

  const renderContent = () => {
    if (activeTab === 'local') {
      return Object.values(localVariables.collections).map(collection => (
        <VariableCollectionItem
          key={`local-${collection.id}`}
          collection={collection}
          variables={Object.values(localVariables.variables).map(v => ({
            ...v,
            variableCollectionId: v.variableCollectionId,
            valuesByMode: v.valuesByMode,
          }))}
          isPublished={false}
          onSelectVariable={handleVariableSelect}
        />
      ));
    } else {
      return Object.values(publishedVariables.collections).map(collection => (
        <VariableCollectionItem
          key={`published-${collection.subscribed_id}`}
          collection={collection}
          variables={Object.values(publishedVariables.variables).map(v => ({
            ...v,
            variableCollectionId: v.variableCollectionId,
            valuesByMode: {}, // Published variables don't expose all mode values directly here, mocking
          }))}
          isPublished={true}
          onSelectVariable={handleVariableSelect}
        />
      ));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Variable Catalog</Text>
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'local' && styles.activeTab]}
            onPress={() => setActiveTab('local')}
          >
            <Text style={styles.tabText}>Local Variables</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'published' && styles.activeTab]}
            onPress={() => setActiveTab('published')}
          >
            <Text style={styles.tabText}>Published Variables</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>{renderContent()}</ScrollView>

      {selectedVariable && (
        <View style={styles.variableInspector}>
          <Text style={styles.inspectorTitle}>Selected Variable</Text>
          <Text>Name: {selectedVariable.name}</Text>
          <Text>Collection: {selectedVariable.collectionName}</Text>
          <Text>Type: {selectedVariable.type}</Text>
          <Text>ID: {selectedVariable.id.substring(0, 8)}...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f8f8f8',
  },
  headerContainer: {
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  collectionContainer: {
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 10,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f0f0f0',
  },
  collectionNameText: {
    fontWeight: '600',
    fontSize: 14,
    color: '#000',
  },
  variablesList: {
    paddingLeft: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  variableRow: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  selectedVariableRow: {
    backgroundColor: '#e0f0ff',
  },
  variableNameText: {
    fontSize: 13,
    color: '#333',
  },
  detailsBox: {
    padding: 10,
    backgroundColor: '#fafafa',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  detailLabel: {
    fontSize: 12,
    color: '#555',
    marginBottom: 4,
  },
  detailsSection: {
    marginTop: 8,
  },
  detailSubtitle: {
    fontWeight: '600',
    fontSize: 12,
    marginBottom: 4,
  },
  showValuesText: {
    fontSize: 12,
    color: '#007AFF',
    textDecorationLine: 'underline',
    marginBottom: 4,
  },
  modeValuesList: {
    paddingLeft: 5,
    marginTop: 5,
  },
  modeValueText: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
  },
  variableInspector: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#eaf6ff',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  inspectorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#007AFF',
  },
});

export default VariableCatalog;