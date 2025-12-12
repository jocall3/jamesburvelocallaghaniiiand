import { Person, Organization, Thing, Account } from './ontology';

export class RelationshipInference {
    private people: Person[] = [];
    private organizations: Organization[] = [];
    private things: Thing[] = [];
    private accounts: Account[] = [];

    constructor(people: Person[], organizations: Organization[], things: Thing[], accounts: Account[]) {
        this.people = people;
        this.organizations = organizations;
        this.things = things;
        this.accounts = accounts;
    }

    /**
     * Infers relationships based on shared attributes.
     * For example, if two people share the same address, they might be related.
     * If a person works for an organization, create a link.
     */
    public inferRelationships(): void {
        this.inferPersonOrganizationRelationships();
        this.inferPersonThingRelationships();
        this.inferOrganizationThingRelationships();
        this.inferPersonAccountRelationships();
        this.inferOrganizationAccountRelationships();
    }

    /**
     * Infers relationships between Person and Organization.
     * Example: If a Person's 'worksFor' attribute matches an Organization's 'name'.
     */
    private inferPersonOrganizationRelationships(): void {
        for (const person of this.people) {
            if (person.worksFor) {
                const organization = this.organizations.find(org => org.name === person.worksFor);
                if (organization) {
                    person.relationships.worksFor = organization;
                    organization.relationships.employees.push(person);
                }
            }
        }
    }

    /**
     * Infers relationships between Person and Thing.
     * Example: If a Person's 'owns' attribute matches a Thing's 'name'.
     */
    private inferPersonThingRelationships(): void {
        for (const person of this.people) {
            if (person.owns) {
                const thing = this.things.find(t => t.name === person.owns);
                if (thing) {
                    person.relationships.ownsThing = thing;
                    thing.relationships.owners.push(person);
                }
            }
            if (person.uses) {
                const thing = this.things.find(t => t.name === person.uses);
                if (thing) {
                    person.relationships.usesThing = thing;
                    thing.relationships.users.push(person);
                }
            }
        }
    }

    /**
     * Infers relationships between Organization and Thing.
     * Example: If an Organization's 'produces' attribute matches a Thing's 'name'.
     */
    private inferOrganizationThingRelationships(): void {
        for (const org of this.organizations) {
            if (org.produces) {
                const thing = this.things.find(t => t.name === org.produces);
                if (thing) {
                    org.relationships.producesThing = thing;
                    thing.relationships.producedBy = org;
                }
            }
            if (org.sells) {
                const thing = this.things.find(t => t.name === org.sells);
                if (thing) {
                    org.relationships.sellsThing = thing;
                    thing.relationships.soldBy.push(org);
                }
            }
        }
    }

    /**
     * Infers relationships between Person and Account.
     * Example: If a Person's 'accountNumber' matches an Account's 'accountNumber'.
     */
    private inferPersonAccountRelationships(): void {
        for (const person of this.people) {
            if (person.accountNumber) {
                const account = this.accounts.find(acc => acc.accountNumber === person.accountNumber);
                if (account) {
                    person.relationships.account = account;
                    account.relationships.holder = person;
                }
            }
        }
    }

    /**
     * Infers relationships between Organization and Account.
     * Example: If an Organization's 'accountNumber' matches an Account's 'accountNumber'.
     */
    private inferOrganizationAccountRelationships(): void {
        for (const org of this.organizations) {
            if (org.accountNumber) {
                const account = this.accounts.find(acc => acc.accountNumber === org.accountNumber);
                if (account) {
                    org.relationships.account = account;
                    account.relationships.holder = org;
                }
            }
        }
    }

    /**
     * Adds a person to the inference engine.
     * @param person The Person object to add.
     */
    public addPerson(person: Person): void {
        this.people.push(person);
    }

    /**
     * Adds an organization to the inference engine.
     * @param organization The Organization object to add.
     */
    public addOrganization(organization: Organization): void {
        this.organizations.push(organization);
    }

    /**
     * Adds a thing to the inference engine.
     * @param thing The Thing object to add.
     */
    public addThing(thing: Thing): void {
        this.things.push(thing);
    }

    /**
     * Adds an account to the inference engine.
     * @param account The Account object to add.
     */
    public addAccount(account: Account): void {
        this.accounts.push(account);
    }
}