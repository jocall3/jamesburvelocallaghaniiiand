export type Extension = {
  [key: `x-${string}`]: any;
};

export interface OpenApiDocument extends Extension {
  openapi: string;
  info: InfoObject;
  jsonSchemaDialect?: string;
  servers?: ServerObject[];
  paths?: PathsObject;
  webhooks?: Record<string, PathItemObject | ReferenceObject>;
  components?: ComponentsObject;
  security?: SecurityRequirementObject[];
  tags?: TagObject[];
  externalDocs?: ExternalDocumentationObject;
}

export interface InfoObject extends Extension {
  title: string;
  summary?: string;
  description?: string;
  termsOfService?: string;
  contact?: ContactObject;
  license?: LicenseObject;
  version: string;
}

export interface ContactObject extends Extension {
  name?: string;
  url?: string;
  email?: string;
}

export interface LicenseObject extends Extension {
  name: string;
  identifier?: string;
  url?: string;
}

export interface ServerObject extends Extension {
  url: string;
  description?: string;
  variables?: Record<string, ServerVariableObject>;
}

export interface ServerVariableObject extends Extension {
  enum?: string[];
  default: string;
  description?: string;
}

export interface ComponentsObject extends Extension {
  schemas?: Record<string, SchemaObject>;
  responses?: Record<string, ResponseObject | ReferenceObject>;
  parameters?: Record<string, ParameterObject | ReferenceObject>;
  examples?: Record<string, ExampleObject | ReferenceObject>;
  requestBodies?: Record<string, RequestBodyObject | ReferenceObject>;
  headers?: Record<string, HeaderObject | ReferenceObject>;
  securitySchemes?: Record<string, SecuritySchemeObject | ReferenceObject>;
  links?: Record<string, LinkObject | ReferenceObject>;
  callbacks?: Record<string, CallbackObject | ReferenceObject>;
  pathItems?: Record<string, PathItemObject | ReferenceObject>;
}

export interface PathsObject extends Extension {
  [pattern: string]: PathItemObject | any; // 'any' allows for extensions, though strictly it's PathItem
}

export interface PathItemObject extends Extension {
  $ref?: string;
  summary?: string;
  description?: string;
  get?: OperationObject;
  put?: OperationObject;
  post?: OperationObject;
  delete?: OperationObject;
  options?: OperationObject;
  head?: OperationObject;
  patch?: OperationObject;
  trace?: OperationObject;
  servers?: ServerObject[];
  parameters?: (ParameterObject | ReferenceObject)[];
}

export interface OperationObject extends Extension {
  tags?: string[];
  summary?: string;
  description?: string;
  externalDocs?: ExternalDocumentationObject;
  operationId?: string;
  parameters?: (ParameterObject | ReferenceObject)[];
  requestBody?: RequestBodyObject | ReferenceObject;
  responses?: ResponsesObject;
  callbacks?: Record<string, CallbackObject | ReferenceObject>;
  deprecated?: boolean;
  security?: SecurityRequirementObject[];
  servers?: ServerObject[];
}

export interface ExternalDocumentationObject extends Extension {
  description?: string;
  url: string;
}

export interface ParameterObject extends Extension {
  name: string;
  in: 'query' | 'header' | 'path' | 'cookie';
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  style?: string;
  explode?: boolean;
  allowReserved?: boolean;
  schema?: SchemaObject | ReferenceObject;
  example?: any;
  examples?: Record<string, ExampleObject | ReferenceObject>;
  content?: Record<string, MediaTypeObject>;
}

export interface RequestBodyObject extends Extension {
  description?: string;
  content: Record<string, MediaTypeObject>;
  required?: boolean;
}

export interface MediaTypeObject extends Extension {
  schema?: SchemaObject | ReferenceObject;
  example?: any;
  examples?: Record<string, ExampleObject | ReferenceObject>;
  encoding?: Record<string, EncodingObject>;
}

export interface EncodingObject extends Extension {
  contentType?: string;
  headers?: Record<string, HeaderObject | ReferenceObject>;
  style?: string;
  explode?: boolean;
  allowReserved?: boolean;
}

export interface ResponsesObject extends Extension {
  default?: ResponseObject | ReferenceObject;
  [statusCode: string]: ResponseObject | ReferenceObject | any;
}

export interface ResponseObject extends Extension {
  description: string;
  headers?: Record<string, HeaderObject | ReferenceObject>;
  content?: Record<string, MediaTypeObject>;
  links?: Record<string, LinkObject | ReferenceObject>;
}

export interface CallbackObject extends Extension {
  [expression: string]: PathItemObject | ReferenceObject | any;
}

export interface ExampleObject extends Extension {
  summary?: string;
  description?: string;
  value?: any;
  externalValue?: string;
}

export interface LinkObject extends Extension {
  operationRef?: string;
  operationId?: string;
  parameters?: Record<string, any | string>;
  requestBody?: any | string;
  description?: string;
  server?: ServerObject;
}

export interface HeaderObject extends Extension {
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  style?: string;
  explode?: boolean;
  schema?: SchemaObject | ReferenceObject;
  example?: any;
  examples?: Record<string, ExampleObject | ReferenceObject>;
  content?: Record<string, MediaTypeObject>;
}

export interface TagObject extends Extension {
  name: string;
  description?: string;
  externalDocs?: ExternalDocumentationObject;
}

export interface ReferenceObject {
  $ref: string;
  summary?: string;
  description?: string;
}

export interface SchemaObject extends Extension {
  // JSON Schema 2020-12 Core
  $schema?: string;
  $id?: string;
  $vocabulary?: Record<string, boolean>;
  $anchor?: string;
  $dynamicAnchor?: string;
  $ref?: string;
  $dynamicRef?: string;
  $defs?: Record<string, SchemaObject>;
  $comment?: string;

  // JSON Schema Applicators
  allOf?: SchemaObject[];
  anyOf?: SchemaObject[];
  oneOf?: SchemaObject[];
  not?: SchemaObject;
  if?: SchemaObject;
  then?: SchemaObject;
  else?: SchemaObject;
  dependentSchemas?: Record<string, SchemaObject>;

  // JSON Schema Validation
  prefixItems?: SchemaObject[];
  items?: SchemaObject; // In 2020-12, items is a schema, not array of schemas (that's prefixItems)
  contains?: SchemaObject;
  properties?: Record<string, SchemaObject>;
  patternProperties?: Record<string, SchemaObject>;
  additionalProperties?: SchemaObject | boolean;
  propertyNames?: SchemaObject;
  unevaluatedItems?: SchemaObject | boolean;
  unevaluatedProperties?: SchemaObject | boolean;

  type?: SchemaType | SchemaType[];
  enum?: any[];
  const?: any;
  multipleOf?: number;
  maximum?: number;
  exclusiveMaximum?: number;
  minimum?: number;
  exclusiveMinimum?: number;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  maxItems?: number;
  minItems?: number;
  uniqueItems?: boolean;
  maxContains?: number;
  minContains?: number;
  maxProperties?: number;
  minProperties?: number;
  required?: string[];
  dependentRequired?: Record<string, string[]>;

  // JSON Schema Metadata
  title?: string;
  description?: string;
  default?: any;
  deprecated?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
  examples?: any[];

  // JSON Schema Format
  format?: string;

  // OpenAPI Specific
  discriminator?: DiscriminatorObject;
  xml?: XmlObject;
  externalDocs?: ExternalDocumentationObject;
  example?: any; // Deprecated in 3.1 but often supported for back-compat
}

export type SchemaType = 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array' | 'null';

export interface DiscriminatorObject {
  propertyName: string;
  mapping?: Record<string, string>;
}

export interface XmlObject extends Extension {
  name?: string;
  namespace?: string;
  prefix?: string;
  attribute?: boolean;
  wrapped?: boolean;
}

export type SecuritySchemeObject =
  | ApiKeySecurityScheme
  | HttpSecurityScheme
  | OAuth2SecurityScheme
  | OpenIdConnectSecurityScheme
  | MutualTLSSecurityScheme;

export interface ApiKeySecurityScheme extends Extension {
  type: 'apiKey';
  description?: string;
  name: string;
  in: 'query' | 'header' | 'cookie';
}

export interface HttpSecurityScheme extends Extension {
  type: 'http';
  description?: string;
  scheme: string;
  bearerFormat?: string;
}

export interface OAuth2SecurityScheme extends Extension {
  type: 'oauth2';
  description?: string;
  flows: OAuthFlowsObject;
}

export interface OpenIdConnectSecurityScheme extends Extension {
  type: 'openIdConnect';
  description?: string;
  openIdConnectUrl: string;
}

export interface MutualTLSSecurityScheme extends Extension {
  type: 'mutualTLS';
  description?: string;
}

export interface OAuthFlowsObject extends Extension {
  implicit?: OAuthFlowObject;
  password?: OAuthFlowObject;
  clientCredentials?: OAuthFlowObject;
  authorizationCode?: OAuthFlowObject;
}

export interface OAuthFlowObject extends Extension {
  authorizationUrl?: string;
  tokenUrl?: string;
  refreshUrl?: string;
  scopes: Record<string, string>;
}

export interface SecurityRequirementObject {
  [name: string]: string[];
}