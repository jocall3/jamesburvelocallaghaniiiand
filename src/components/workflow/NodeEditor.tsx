import React, { useCallback, useMemo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Plus, Trash2 } from 'lucide-react';

// In a real project, these types would be in a shared file like `src/types/workflow.ts`
export type NodeType = 'trigger' | 'apiCall' | 'googleDrive' | 'github' | 'script';

export interface BaseNodeData {
  label: string;
  description?: string;
}

export interface TriggerNodeData extends BaseNodeData {
  triggerType: 'webhook' | 'schedule' | 'manual';
  webhookUrl?: string;
  scheduleCron?: string;
}

export interface ApiNodeData extends BaseNodeData {
  apiUrl: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers: Array<{ id: string; key: string; value: string; enabled: boolean }>;
  queryParams: Array<{ id: string; key: string; value: string; enabled: boolean }>;
  bodyType: 'none' | 'json' | 'raw';
  body?: string;
  authType: 'none' | 'bearer' | 'apiKey' | 'oauth2';
  authConfig?: {
    token?: string;
    apiKey?: string;
    apiHeader?: string;
    // OAuth would be more complex, linking to a credential store
    credentialId?: string;
  };
  preExecutionScript?: string;
  postExecutionScript?: string;
}

export interface GoogleDriveNodeData extends BaseNodeData {
  operation: 'upload' | 'download' | 'listFiles' | 'createFolder';
  credentialId: string; // ID of the connected Google account
  filePath?: string;
  folderId?: string;
  fileContent?: string;
}

export interface GitHubNodeData extends BaseNodeData {
  operation: 'runWorkflow' | 'createIssue' | 'getRepo';
  credentialId: string; // ID of the connected GitHub account
  owner: string;
  repo: string;
  workflowId?: string;
  issueTitle?: string;
  issueBody?: string;
}

export type NodeData = TriggerNodeData | ApiNodeData | GoogleDriveNodeData | GitHubNodeData;

export interface WorkflowNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: NodeData;
}
// End of type definitions

interface NodeEditorProps {
  node: WorkflowNode | null;
  onUpdateNode: (nodeId: string, data: Partial<NodeData>) => void;
  onClose: () => void;
}

const KeyValueEditor: React.FC<{
  title: string;
  items: Array<{ id: string; key: string; value: string; enabled: boolean }>;
  onChange: (items: Array<{ id: string; key: string; value: string; enabled: boolean }>) => void;
}> = ({ title, items, onChange }) => {
  const handleItemChange = (id: string, field: 'key' | 'value', value: string) => {
    const newItems = items.map((item) =>
      item.id === id ? { ...item, [field]: value } : item
    );
    onChange(newItems);
  };

  const handleAddItem = () => {
    onChange([...items, { id: crypto.randomUUID(), key: '', value: '', enabled: true }]);
  };

  const handleRemoveItem = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h4 className="font-medium">{title}</h4>
        <Button variant="outline" size="sm" onClick={handleAddItem}>
          <Plus className="h-4 w-4 mr-2" /> Add
        </Button>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-2">
            <Input
              placeholder="Key"
              value={item.key}
              onChange={(e) => handleItemChange(item.id, 'key', e.target.value)}
              className="flex-1"
            />
            <Input
              placeholder="Value (use {{nodeId.output}} for variables)"
              value={item.value}
              onChange={(e) => handleItemChange(item.id, 'value', e.target.value)}
              className="flex-1"
            />
            <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

const ApiNodeEditor: React.FC<{ node: WorkflowNode; onUpdateNode: NodeEditorProps['onUpdateNode'] }> = ({ node, onUpdateNode }) => {
  const data = node.data as ApiNodeData;

  const updateData = (update: Partial<ApiNodeData>) => {
    onUpdateNode(node.id, { ...data, ...update });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Select
          value={data.method}
          onValueChange={(value: ApiNodeData['method']) => updateData({ method: value })}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="GET">GET</SelectItem>
            <SelectItem value="POST">POST</SelectItem>
            <SelectItem value="PUT">PUT</SelectItem>
            <SelectItem value="DELETE">DELETE</SelectItem>
            <SelectItem value="PATCH">PATCH</SelectItem>
          </SelectContent>
        </Select>
        <Input
          placeholder="https://api.example.com/data"
          value={data.apiUrl}
          onChange={(e) => updateData({ apiUrl: e.target.value })}
        />
      </div>

      <Tabs defaultValue="params">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="params">Params</TabsTrigger>
          <TabsTrigger value="auth">Auth</TabsTrigger>
          <TabsTrigger value="headers">Headers</TabsTrigger>
          <TabsTrigger value="body">Body</TabsTrigger>
          <TabsTrigger value="scripts">Scripts</TabsTrigger>
        </TabsList>
        <TabsContent value="params" className="pt-4">
          <KeyValueEditor
            title="Query Parameters"
            items={data.queryParams}
            onChange={(queryParams) => updateData({ queryParams })}
          />
        </TabsContent>
        <TabsContent value="auth" className="pt-4 space-y-4">
          <Select
            value={data.authType}
            onValueChange={(value: ApiNodeData['authType']) => updateData({ authType: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Authentication Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="bearer">Bearer Token</SelectItem>
              <SelectItem value="apiKey">API Key</SelectItem>
              <SelectItem value="oauth2">OAuth 2.0</SelectItem>
            </SelectContent>
          </Select>
          {data.authType === 'bearer' && (
            <Input
              placeholder="Bearer Token"
              value={data.authConfig?.token || ''}
              onChange={(e) => updateData({ authConfig: { ...data.authConfig, token: e.target.value } })}
            />
          )}
          {data.authType === 'apiKey' && (
            <div className="space-y-2">
              <Input
                placeholder="Header Name (e.g., X-API-KEY)"
                value={data.authConfig?.apiHeader || ''}
                onChange={(e) => updateData({ authConfig: { ...data.authConfig, apiHeader: e.target.value } })}
              />
              <Input
                placeholder="API Key"
                value={data.authConfig?.apiKey || ''}
                onChange={(e) => updateData({ authConfig: { ...data.authConfig, apiKey: e.target.value } })}
              />
            </div>
          )}
          {data.authType === 'oauth2' && (
            <div className="text-sm text-muted-foreground">
              OAuth 2.0 configuration is managed in your project settings. Select a pre-configured credential.
              {/* Dropdown to select a credential would go here */}
            </div>
          )}
        </TabsContent>
        <TabsContent value="headers" className="pt-4">
          <KeyValueEditor
            title="Headers"
            items={data.headers}
            onChange={(headers) => updateData({ headers })}
          />
        </TabsContent>
        <TabsContent value="body" className="pt-4 space-y-4">
          <Select
            value={data.bodyType}
            onValueChange={(value: ApiNodeData['bodyType']) => updateData({ bodyType: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Body Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="json">JSON</SelectItem>
              <SelectItem value="raw">Raw</SelectItem>
            </SelectContent>
          </Select>
          {(data.bodyType === 'json' || data.bodyType === 'raw') && (
            <Textarea
              placeholder={data.bodyType === 'json' ? 'Enter JSON body...' : 'Enter raw body...'}
              value={data.body || ''}
              onChange={(e) => updateData({ body: e.target.value })}
              className="min-h-[200px] font-mono"
            />
          )}
        </TabsContent>
        <TabsContent value="scripts" className="pt-4 space-y-4">
            <div>
                <Label htmlFor="pre-script">Pre-execution Script</Label>
                <Textarea
                    id="pre-script"
                    placeholder="const newRequest = { ...request }; return newRequest;"
                    value={data.preExecutionScript || ''}
                    onChange={(e) => updateData({ preExecutionScript: e.target.value })}
                    className="min-h-[150px] font-mono"
                />
            </div>
            <div>
                <Label htmlFor="post-script">Post-execution Script</Label>
                <Textarea
                    id="post-script"
                    placeholder="const newOutput = { ...response.body }; return newOutput;"
                    value={data.postExecutionScript || ''}
                    onChange={(e) => updateData({ postExecutionScript: e.target.value })}
                    className="min-h-[150px] font-mono"
                />
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const GoogleDriveNodeEditor: React.FC<{ node: WorkflowNode; onUpdateNode: NodeEditorProps['onUpdateNode'] }> = ({ node, onUpdateNode }) => {
    const data = node.data as GoogleDriveNodeData;

    const updateData = (update: Partial<GoogleDriveNodeData>) => {
        onUpdateNode(node.id, { ...data, ...update });
    };

    return (
        <div className="space-y-4">
            <div>
                <Label>Google Account</Label>
                {/* In a real app, this would be a dropdown of connected accounts */}
                <Select value={data.credentialId} onValueChange={(val) => updateData({ credentialId: val })}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a Google Account..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="google-cred-123">My Google Account (user@gmail.com)</SelectItem>
                    </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">Connect accounts in Project Settings.</p>
            </div>
            <div>
                <Label>Operation</Label>
                <Select value={data.operation} onValueChange={(val: GoogleDriveNodeData['operation']) => updateData({ operation: val })}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select an operation..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="upload">Upload File</SelectItem>
                        <SelectItem value="download">Download File</SelectItem>
                        <SelectItem value="listFiles">List Files in Folder</SelectItem>
                        <SelectItem value="createFolder">Create Folder</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            {data.operation === 'upload' && (
                <>
                    <Input placeholder="Folder ID (optional)" value={data.folderId || ''} onChange={e => updateData({ folderId: e.target.value })} />
                    <Input placeholder="File Name" value={data.filePath || ''} onChange={e => updateData({ filePath: e.target.value })} />
                    <Textarea placeholder="File Content (use variables like {{step1.output}})" value={data.fileContent || ''} onChange={e => updateData({ fileContent: e.target.value })} />
                </>
            )}
            {data.operation === 'download' && (
                <Input placeholder="File ID or Path" value={data.filePath || ''} onChange={e => updateData({ filePath: e.target.value })} />
            )}
            {data.operation === 'listFiles' && (
                <Input placeholder="Folder ID (leave blank for root)" value={data.folderId || ''} onChange={e => updateData({ folderId: e.target.value })} />
            )}
            {data.operation === 'createFolder' && (
                <>
                    <Input placeholder="New Folder Name" value={data.filePath || ''} onChange={e => updateData({ filePath: e.target.value })} />
                    <Input placeholder="Parent Folder ID (optional)" value={data.folderId || ''} onChange={e => updateData({ folderId: e.target.value })} />
                </>
            )}
        </div>
    );
};

const GitHubNodeEditor: React.FC<{ node: WorkflowNode; onUpdateNode: NodeEditorProps['onUpdateNode'] }> = ({ node, onUpdateNode }) => {
    const data = node.data as GitHubNodeData;

    const updateData = (update: Partial<GitHubNodeData>) => {
        onUpdateNode(node.id, { ...data, ...update });
    };

    return (
        <div className="space-y-4">
            <div>
                <Label>GitHub Account</Label>
                <Select value={data.credentialId} onValueChange={(val) => updateData({ credentialId: val })}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a GitHub Account..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="github-cred-123">My GitHub Account (username)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div>
                <Label>Operation</Label>
                <Select value={data.operation} onValueChange={(val: GitHubNodeData['operation']) => updateData({ operation: val })}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select an operation..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="runWorkflow">Run Workflow</SelectItem>
                        <SelectItem value="createIssue">Create Issue</SelectItem>
                        <SelectItem value="getRepo">Get Repo Details</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Owner (e.g., 'openai')" value={data.owner} onChange={e => updateData({ owner: e.target.value })} />
                <Input placeholder="Repo (e.g., 'gpt-3')" value={data.repo} onChange={e => updateData({ repo: e.target.value })} />
            </div>
            {data.operation === 'runWorkflow' && (
                <Input placeholder="Workflow ID (e.g., 'ci.yml')" value={data.workflowId || ''} onChange={e => updateData({ workflowId: e.target.value })} />
            )}
            {data.operation === 'createIssue' && (
                <>
                    <Input placeholder="Issue Title" value={data.issueTitle || ''} onChange={e => updateData({ issueTitle: e.target.value })} />
                    <Textarea placeholder="Issue Body (Markdown supported)" value={data.issueBody || ''} onChange={e => updateData({ issueBody: e.target.value })} />
                </>
            )}
        </div>
    );
};

const TriggerNodeEditor: React.FC<{ node: WorkflowNode; onUpdateNode: NodeEditorProps['onUpdateNode'] }> = ({ node, onUpdateNode }) => {
    const data = node.data as TriggerNodeData;

    const updateData = (update: Partial<TriggerNodeData>) => {
        onUpdateNode(node.id, { ...data, ...update });
    };

    return (
        <div className="space-y-4">
            <div>
                <Label>Trigger Type</Label>
                <Select value={data.triggerType} onValueChange={(val: TriggerNodeData['triggerType']) => updateData({ triggerType: val })}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a trigger..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="webhook">Webhook</SelectItem>
                        <SelectItem value="schedule">Schedule</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            {data.triggerType === 'webhook' && (
                <div>
                    <Label>Webhook URL</Label>
                    <Input readOnly value={data.webhookUrl || 'https://api.yourapp.com/webhook/wfl_...'} />
                    <p className="text-xs text-muted-foreground mt-1">Send a POST request to this URL to trigger the workflow.</p>
                </div>
            )}
            {data.triggerType === 'schedule' && (
                <div>
                    <Label>CRON Expression</Label>
                    <Input placeholder="* * * * *" value={data.scheduleCron || ''} onChange={e => updateData({ scheduleCron: e.target.value })} />
                    <p className="text-xs text-muted-foreground mt-1">e.g., '0 9 * * 1' for every Monday at 9 AM.</p>
                </div>
            )}
        </div>
    );
};

const NodeEditor: React.FC<NodeEditorProps> = ({ node, onUpdateNode, onClose }) => {
  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (node) {
      onUpdateNode(node.id, { label: e.target.value });
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (node) {
      onUpdateNode(node.id, { description: e.target.value });
    }
  };

  const renderEditorContent = () => {
    if (!node) return null;

    switch (node.type) {
      case 'apiCall':
        return <ApiNodeEditor node={node} onUpdateNode={onUpdateNode} />;
      case 'googleDrive':
        return <GoogleDriveNodeEditor node={node} onUpdateNode={onUpdateNode} />;
      case 'github':
        return <GitHubNodeEditor node={node} onUpdateNode={onUpdateNode} />;
      case 'trigger':
        return <TriggerNodeEditor node={node} onUpdateNode={onUpdateNode} />;
      default:
        return <p className="text-muted-foreground">No editor available for this node type.</p>;
    }
  };

  const nodeTypeTitle = useMemo(() => {
    if (!node) return '';
    const titles: Record<NodeType, string> = {
        trigger: 'Workflow Trigger',
        apiCall: 'API Request',
        googleDrive: 'Google Drive',
        github: 'GitHub',
        script: 'Custom Script',
    };
    return titles[node.type] || 'Unknown Node';
  }, [node]);

  return (
    <Sheet open={!!node} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="w-[600px] sm:max-w-none flex flex-col">
        {!node ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Select a node to edit</p>
          </div>
        ) : (
          <>
            <SheetHeader className="pr-12">
              <SheetTitle className="text-2xl">{nodeTypeTitle}</SheetTitle>
              <SheetDescription>Configure the properties for this workflow step.</SheetDescription>
            </SheetHeader>
            <div className="py-4 flex-grow overflow-y-auto pr-6">
              <Card>
                <CardHeader>
                  <CardTitle>General</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="node-label">Label</Label>
                    <Input
                      id="node-label"
                      value={node.data.label}
                      onChange={handleLabelChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="node-description">Description</Label>
                    <Textarea
                      id="node-description"
                      placeholder="Optional description for this step"
                      value={node.data.description || ''}
                      onChange={handleDescriptionChange}
                    />
                  </div>
                </CardContent>
              </Card>
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                  {renderEditorContent()}
                </CardContent>
              </Card>
            </div>
            <SheetFooter>
              <SheetClose asChild>
                <Button type="submit">Done</Button>
              </SheetClose>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default NodeEditor;