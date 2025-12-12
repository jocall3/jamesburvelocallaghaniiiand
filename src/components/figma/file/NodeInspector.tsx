import {
  Node,
  DocumentNode,
  CanvasNode,
  TextNode,
  ComponentNode,
  InstanceNode,
  FrameNode,
  VectorNode,
  RectangleNode,
  StarNode,
  EllipseNode,
  BooleanOperationNode,
  ComponentSetNode,
  GroupNode,
  LineNode,
  RegularPolygonNode,
  SliceNode,
  StickyNode,
  ShapeWithTextNode,
  EmbedNode,
  LinkUnfurlNode,
  ConnectorNode,
  WashiTapeNode,
  WidgetNode,
  TransformGroupNode,
  SectionNode,
  TableCellNode,
  TableNode,
  TextPathNode,
} from "../types/figma.js";

import React, { useState, useEffect, useMemo } from "react";
import { ScrollArea } from "../components/ui/scroll-area";
import { Tree } from "../components/ui/tree";
import { Card, CardHeader, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";
import JSONViewer from "../components/ui/JSONViewer";
import { toast } from "sonner";
import { useFigmaData } from "../hooks/useFigmaData";

interface NodeInspectorProps {
  fileKey: string;
  selectedNodeId: string | null;
}

const NodeInspector: React.FC<NodeInspectorProps> = ({ fileKey, selectedNodeId }) => {
  const { data: fileData, error } = useFigmaData(fileKey);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showJson, setShowJson] = useState<boolean>(false);

  useEffect(() => {
    if (error) {
      toast.error("Error fetching Figma file data:", {
        description: error.message,
      });
    }
  }, [error]);

  const nodeMap = useMemo(() => {
    const nodes: Record<string, Node> = {};
    if (!fileData) return nodes;

    function traverse(node: Node) {
      nodes[node.id] = node;
      if ("children" in node) {
        node.children.forEach(traverse);
      }
    }

    if (fileData.document) {
      traverse(fileData.document);
    }

    return nodes;
  }, [fileData]);

  useEffect(() => {
    if (selectedNodeId && nodeMap[selectedNodeId]) {
      setSelectedNode(nodeMap[selectedNodeId]);
    } else {
      setSelectedNode(null);
    }
  }, [selectedNodeId, nodeMap]);

  const getNodeProperties = (node: Node): Record<string, any> => {
    const properties: Record<string, any> = {
      ID: node.id,
      Name: node.name,
      Type: node.type,
    };

    if ("visible" in node) properties["Visible"] = node.visible;
    if ("locked" in node) properties["Locked"] = node.locked;
    if ("blendMode" in node) properties["Blend Mode"] = node.blendMode;
    if ("opacity" in node) properties["Opacity"] = node.opacity;

    if ("characters" in node) {
      properties["Characters"] = node.characters;
      properties["Font Family"] = node.style.fontFamily;
      properties["Font Size"] = node.style.fontSize;
      properties["Font Weight"] = node.style.fontWeight;
      properties["Text Align"] = `${node.style.textAlignHorizontal}, ${node.style.textAlignVertical}`;
    }

    if ("absoluteBoundingBox" in node) {
      properties["Absolute Bounding Box"] = `${node.absoluteBoundingBox.x}, ${node.absoluteBoundingBox.y}, ${node.absoluteBoundingBox.width}, ${node.absoluteBoundingBox.height}`;
    }

    if ("componentId" in node) {
      properties["Component ID"] = node.componentId;
    }
    if ("constraints" in node) {
      properties["Constraints"] = `${node.constraints.vertical} ${node.constraints.horizontal}`;
    }

    if ("fills" in node && node.fills.length > 0) {
      properties["Fills"] = node.fills.map((fill) => fill.type).join(", ");
    }

    if ("strokes" in node && node.strokes.length > 0) {
      properties["Strokes"] = node.strokes.map((stroke) => stroke.type).join(", ");
      properties["Stroke Weight"] = node.strokeWeight;
      properties["Stroke Align"] = node.strokeAlign;
    }

    if ("effects" in node && node.effects.length > 0) {
      properties["Effects"] = node.effects.map((effect) => effect.type).join(", ");
    }

    if ("layoutMode" in node && node.layoutMode !== "NONE") {
      properties["Layout Mode"] = node.layoutMode;
      if ("itemSpacing" in node) properties["Item Spacing"] = node.itemSpacing;
      if ("paddingLeft" in node) properties["Padding Left"] = node.paddingLeft;
      if ("paddingRight" in node) properties["Padding Right"] = node.paddingRight;
      if ("paddingTop" in node) properties["Padding Top"] = node.paddingTop;
      if ("paddingBottom" in node) properties["Padding Bottom"] = node.paddingBottom;
    }

    if ("cornerRadius" in node) {
      properties["Corner Radius"] = node.cornerRadius;
    }

    return properties;
  };

  const renderNodeProperties = (node: Node) => {
    const properties = getNodeProperties(node);
    return (
      <div className="grid grid-cols-2 gap-2 text-sm">
        {Object.entries(properties).map(([key, value]) => (
          <React.Fragment key={key}>
            <div className="font-medium text-gray-700 dark:text-gray-300">{key}:</div>
            <div className="truncate" title={String(value)}>
              {typeof value === "object" ? JSON.stringify(value) : String(value)}
            </div>
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <ScrollArea className="h-full w-full rounded-md border">
      {selectedNode ? (
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Node Inspector</h3>
            <Button variant="outline" size="sm" onClick={() => setShowJson(!showJson)}>
              {showJson ? "Hide JSON" : "Show JSON"}
            </Button>
          </div>

          {showJson ? (
            <JSONViewer src={selectedNode} />
          ) : (
            <Card>
              <CardHeader>
                <h4 className="text-lg font-semibold capitalize">{selectedNode.type}</h4>
                <p className="text-sm text-muted-foreground">{selectedNode.name}</p>
              </CardHeader>
              <CardContent>{renderNodeProperties(selectedNode)}</CardContent>
            </Card>
          )}

          {/* Optionally display children or other related info */}
        </div>
      ) : (
        <div className="flex h-full items-center justify-center text-muted-foreground">
          Select a node to inspect.
        </div>
      )}
    </ScrollArea>
  );
};

export default NodeInspector;