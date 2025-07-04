"use client";

import React, { useCallback, useState, useRef } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  useReactFlow,
  Panel,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { v4 as uuidv4 } from "uuid";
import TextNode from "./TextNode";
import { toast, Toaster } from "react-hot-toast";

/* --------------------------- type & node map --------------------------- */
type TextNodeData = {
  label: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const nodeTypes = { textNode: TextNode };

/* ------------------------------ component ------------------------------ */
export default function FlowBuilder() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  const [nodes, setNodes] = useState<Node<TextNodeData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node<TextNodeData> | null>(
    null
  );

  /* --------------------------- change handlers -------------------------- */
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds));

      changes.forEach((c) => {
        if (c.type !== "select") return;

        const node = nodes.find((n) => n.id === c.id) ?? null;
        setSelectedNode(c.selected ? node : null);
      });
    },
    [nodes]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (conn: Connection) => {
      const duplicate = edges.some(
        (e) =>
          e.source === conn.source && e.sourceHandle === conn.sourceHandle
      );

      if (duplicate) {
        toast.error("Source handle already has an outgoing edge.");
        return;
      }

      setEdges((eds) =>
        addEdge({ ...conn, markerEnd: { type: MarkerType.ArrowClosed } }, eds)
      );
    },
    [edges]
  );

  /* --------------------------- drag & drop ----------------------------- */
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();

      const type = e.dataTransfer.getData(
        "application/reactflow"
      ) as keyof typeof nodeTypes | "";

      if (!type) return;

      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const id = uuidv4();

      const newNode: Node<TextNodeData> = {
        id,
        type,
        position,
        data: {
          label: "Text Message",
          onChange: (evt) => onNodeLabelChange(id, evt.target.value),
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition]
  );

  /* ------------------------- helpers & actions ------------------------- */
  const onNodeLabelChange = useCallback((id: string, label: string) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, label } } : n
      )
    );
    setSelectedNode((prev) =>
      prev && prev.id === id ? { ...prev, data: { ...prev.data, label } } : prev
    );
  }, []);

  const onSave = useCallback(() => {
    if (nodes.length > 1) {
      const unlinked = nodes.filter(
        (n) => !edges.some((e) => e.target === n.id)
      );
      if (unlinked.length > 1) {
        toast.error("More than one node lacks an incoming edge.");
        return;
      }
    }
    toast.success("Flow saved!");
    console.log({ nodes, edges });
  }, [nodes, edges]);

  const onDragStart = (
    e: React.DragEvent,
    type: keyof typeof nodeTypes
  ): void => {
    e.dataTransfer.setData("application/reactflow", type);
    e.dataTransfer.effectAllowed = "move";
  };

  /* ------------------------------ render ------------------------------- */
  return (
    <div className="flex h-screen w-screen">
      <Toaster position="top-center" />

      <div className="flex-grow h-full" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
          <Panel position="top-right">
            <button
              onClick={onSave}
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              Save Flow
            </button>
          </Panel>
        </ReactFlow>
      </div>

      {/* Sidebar */}
      <div className="w-80 bg-gray-100 p-4 border-l border-gray-300 flex flex-col">
        {selectedNode ? (
          <div>
            <h3 className="text-lg font-semibold mb-4">Settings</h3>
            <label className="block mb-1 text-sm font-medium">Node Text</label>
            <input
              type="text"
              className="w-full p-2 border rounded-md"
              value={selectedNode.data.label}
              onChange={(e) =>
                onNodeLabelChange(selectedNode.id, e.target.value)
              }
            />
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-semibold mb-4">Nodes</h3>
            <div
              className="p-4 border rounded-md cursor-grab bg-white text-center text-blue-500"
              draggable
              onDragStart={(e) => onDragStart(e, "textNode")}
            >
              Text Message
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
