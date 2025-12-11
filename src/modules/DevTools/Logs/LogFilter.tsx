import React, { useState, useMemo, useCallback } from 'react';
import { Select, Input, Button, Tag, message } from 'antd';
import styled from 'styled-components';

const { Option } = Select;
const { Search } = Input;

const LogFilterContainer = styled.div`
  padding: 16px;
  border: 1px solid #eee;
  border-radius: 4px;
  background-color: #fff;
`;

const FilterSection = styled.div`
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }
`;

const SectionTitle = styled.h4`
  margin-bottom: 8px;
  font-size: 14px;
  color: #333;
`;

const StyledSelect = styled(Select)`
  width: 100%;
`;

const TagContainer = styled.div`
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const SeverityTag = styled(Tag)`
  cursor: pointer;
  transition: all 0.3s;
  &:hover {
    opacity: 0.8;
  }
`;

// Mock data for severity levels and sources
const SEVERITY_LEVELS = ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];
const MOCK_SOURCES = ['com.nicity.plugins.idea.TimePlugin', 'com.nicity.plugins.idea.TimeConvertorPlugin', 'com.nicity.plugins.idea.RSSPlugin', 'com.nicity.plugins.idea.CompileWithoutDependencies', 'com.nicity.plugins.idea.ModuleDependencyGraph', 'com.nicity.plugins.idea.Hagrid', 'com.nicity.plugins.idea.SimplePowerPack'];

/**
 * @typedef {Object} LogFilterState
 * @property {string[]} severities - Selected log severities
 * @property {string[]} sources - Selected log sources
 * @property {string} keyword - Keyword to search for
 */

/**
 * Component for advanced filtering of system logs.
 * @param {{onFilterChange: function(LogFilterState): void}} props
 */
const LogFilter = ({ onFilterChange }) => {
  const [selectedSeverities, setSelectedSeverities] = useState([]);
  const [selectedSources, setSelectedSources] = useState([]);
  const [keyword, setKeyword] = useState('');

  const handleSeverityToggle = useCallback((severity) => {
    setSelectedSeverities(prev =>
      prev.includes(severity)
        ? prev.filter(s => s !== severity)
        : [...prev, severity]
    );
  }, []);

  const handleSourceChange = useCallback((sources) => {
    setSelectedSources(sources);
  }, []);

  const handleKeywordSearch = useCallback((value) => {
    setKeyword(value);
  }, []);

  // Debounced or immediate filtering logic (using useMemo/useEffect for real debounce, but keeping it simple here)
  const currentFilters = useMemo(() => ({
    severities: selectedSeverities,
    sources: selectedSources,
    keyword: keyword,
  }), [selectedSeverities, selectedSources, keyword]);

  // Trigger parent callback when filters change
  React.useEffect(() => {
    onFilterChange(currentFilters);
  }, [currentFilters, onFilterChange]);

  const handleClearAll = () => {
    setSelectedSeverities([]);
    setSelectedSources([]);
    setKeyword('');
    message.info('Filters cleared.');
  };

  return (
    <LogFilterContainer>
      <SectionTitle>Keyword Search</SectionTitle>
      <FilterSection>
        <Search
          placeholder="Enter keyword to search log messages"
          value={keyword}
          onChange={(e) => handleKeywordSearch(e.target.value)}
          onSearch={handleKeywordSearch}
          enterButton="Search"
        />
      </FilterSection>

      <FilterSection>
        <SectionTitle>Severity Level</SectionTitle>
        <TagContainer>
          {SEVERITY_LEVELS.map((severity) => (
            <SeverityTag
              key={severity}
              color={selectedSeverities.includes(severity) ? "blue" : "default"}
              onClick={() => handleSeverityToggle(severity)}
            >
              {severity}
            </SeverityTag>
          ))}
        </TagContainer>
        <TagContainer style={{ marginTop: '10px' }}>
          {selectedSeverities.map(s => (
            <Tag closable onClose={(e) => { e.stopPropagation(); handleSeverityToggle(s); }} color="blue" key={`selected-${s}`}>
              Severity: {s}
            </Tag>
          ))}
        </TagContainer>
      </FilterSection>

      <FilterSection>
        <SectionTitle>Source Plugin/Class</SectionTitle>
        <StyledSelect
          mode="multiple"
          placeholder="Select log sources (plugins/classes)"
          value={selectedSources}
          onChange={handleSourceChange}
          allowClear
        >
          {MOCK_SOURCES.map((source) => (
            <Option key={source} value={source}>
              {source}
            </Option>
          ))}
        </StyledSelect>
        <TagContainer style={{ marginTop: '10px' }}>
          {selectedSources.map(s => (
            <Tag closable onClose={(e) => { e.stopPropagation(); handleSourceChange(selectedSources.filter(src => src !== s)); }} color="green" key={`selected-src-${s}`}>
              Source: {s.length > 30 ? `${s.substring(0, 27)}...` : s}
            </Tag>
          ))}
        </TagContainer>
      </FilterSection>

      <FilterSection style={{ borderBottom: 'none', paddingTop: '10px' }}>
        <Button onClick={handleClearAll} danger block>
          Clear All Filters
        </Button>
      </FilterSection>
    </LogFilterContainer>
  );
};

export default LogFilter;