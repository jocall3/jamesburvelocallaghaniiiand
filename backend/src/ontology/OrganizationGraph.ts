import { Vertex } from "../graph/Vertex";
import { Property } from "../graph/Property";
import { Ontology } from "../Ontology";

/**
 * Represents a company or organization.
 */
export class OrganizationGraph extends Vertex {
    public static Ontology = new Ontology().addVertex("Organization", [
        new Property("Name", "string", true),
        new Property("Alias", "string[]", false),
        new Property("Industry", "string[]", false),
        new Property("Headquarters", "AddressGraph", false),
        new Property("StockTicker", "string[]", false),
        new Property("Website", "string[]", false),
        new Property("Employees", "integer", false),
        new Property("Revenue", "decimal", false),
        new Property("Profits", "decimal", false),
        new Property("FoundingDate", "date", false),
        new Property("DissolutionDate", "date", false),
        new Property("Parent", "OrganizationGraph", false)
    ]);

    constructor(id?: string) {
        super(id);
    }

    public clone(): OrganizationGraph {
        const clone = new OrganizationGraph(this.id);
        for (const property of this.properties) {
            clone.properties.push(property.clone());
        }
        return clone;
    }
}

/**
 * Represents an address.
 */
export class AddressGraph extends Vertex {
    public static Ontology = new Ontology().addVertex("Address", [
        new Property("StreetAddress", "string", false),
        new Property("AddressLocality", "string", false),
        new Property("AddressRegion", "string", false),
        new Property("AddressCountry", "string", false),
        new Property("PostalCode", "string", false),
        new Property("PostOfficeBoxNumber", "string", false)
    ]);

    constructor(id?: string) {
        super(id);
    }

    public clone(): AddressGraph {
        const clone = new AddressGraph(this.id);
        for (const property of this.properties) {
            clone.properties.push(property.clone());
        }
        return clone;
    }
}<ctrl63>