import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMicrosoft, faBuromobelexperte } from "@fortawesome/free-brands-svg-icons";

interface TypeIconProps {
  applicationType: string;
}

const TypeIcon: React.FC<TypeIconProps> = ({ applicationType }) => {
  switch (applicationType) {
    case "Enterprise Application":
      return <FontAwesomeIcon icon={faBuromobelexperte} size="lg" />;
    case "Microsoft Application":
    case "Managed Identity":
      return <FontAwesomeIcon icon={faMicrosoft} size="lg" />;
    default:
      return null;
  }
};

export default TypeIcon;