
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Biso20022 } from '../types/biso20022';

interface ElectionChoiceFormProps {
  availableChoices: Biso20022;
  onSubmit: (values: Biso20022) => void;
  onCancel: () => void;
}

const ElectionChoiceForm: React.FC<ElectionChoiceFormProps> = ({ availableChoices, onSubmit, onCancel }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<Biso20022>();
  const [selectedChoice, setSelectedChoice] = useState<Biso20022 | null>(null);

  const handleChoiceSelect = (choice: Biso20022) => {
    setSelectedChoice(choice);
  };

  const handleSubmitForm = (data: Biso20022) => {
    onSubmit(data);
  };


  return (
    <form onSubmit={handleSubmit(handleSubmitForm)}>
      {/*  Example implementation, adjust based on availableChoices structure */}
        <div>
          {/*  Example implementation, adjust based on availableChoices structure */}
            <label htmlFor="ExternalElectionType1Code">Choose an Election</label>
            <select {...register("ExternalElectionType1Code")} id="ExternalElectionType1Code">
                <option value="">Select an option</option>
               
            </select>

        </div>

      <button type="submit">Submit Election</button>
      <button type="button" onClick={onCancel}>Cancel</button>
    </form>
  );
};

export default ElectionChoiceForm;
