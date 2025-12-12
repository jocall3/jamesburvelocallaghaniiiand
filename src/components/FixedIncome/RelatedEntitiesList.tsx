import React from 'react';

interface RelatedEntity {
  name: string;
  shareOfCommonShare: string;
  shareInAuthorizedCapital: string;
}

interface RelatedEntitiesListProps {
  entities: RelatedEntity[];
}

const RelatedEntitiesList: React.FC<RelatedEntitiesListProps> = ({ entities }) => {
  if (!entities || entities.length === 0) {
    return <p>No related entities found.</p>;
  }

  return (
    <div>
      <h3>Related Entities</h3>
      <table>
        <thead>
          <tr>
            <th>Related Emitent</th>
            <th>Share of Common Share</th>
            <th>Share in the Authorized Capital</th>
          </tr>
        </thead>
        <tbody>
          {entities.map((entity, index) => (
            <tr key={index}>
              <td>{entity.name}</td>
              <td>{entity.shareOfCommonShare}</td>
              <td>{entity.shareInAuthorizedCapital}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RelatedEntitiesList;