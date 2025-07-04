"use client";

import React, { useCallback, useState, useRef } from "react";
import ReactFlow,
  { Background,
    Controls,
    MiniMap,
    addEdge,
    applyNodeChanges,
    applyEdgeChanges,
    Connection,
    Edge,
    Node,
    useReactFlow,
    Panel,
    MarkerType,
  } from "reactflow";
import "reactflow/dist/style.css";
import { v4 as uuidv4 } from "uuid";
import TextNode from "./TextNode";
import { toast, Toaster } from 'react-hot-toast';

const nodeTypes = { textNode: TextNode };

export default function FlowBuilder() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();
  const [nodes, setNodes] = useState<Node[]>(
    []
  );
  const [edges, setEdges] = useState<Edge[]>(
    []
  );
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const onNodesChange = useCallback(
    (changes: any) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
      changes.forEach((change: any) => {
        if (change.type === 'select' && change.selected) {
          const node = nodes.find(n => n.id === change.id);
          setSelectedNode(node || null);
        } else if (change.type === 'select' && !change.selected && selectedNode?.id === change.id) {
          setSelectedNode(null);
        }
      });
    },
    [nodes, selectedNode]
  );

  const onEdgesChange = useCallback(
    (changes: any) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      // Check if the source handle already has an edge
      const existingEdge = edges.find(edge => edge.source === connection.source && edge.sourceHandle === connection.sourceHandle);
      if (existingEdge) {
        toast.error("Source handle can only have one edge originating from it.");
        return;
      }

      setEdges((eds) => addEdge({
        ...connection,
        markerEnd: { type: MarkerType.ArrowClosed },
      }, eds));
    },
    [edges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: uuidv4(),
        type,
        position,
        data: { label: 'Text Message', onChange: (e: React.ChangeEvent<HTMLInputElement>) => onNodeLabelChange(newNode.id, e.target.value) },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, nodes]
  );

  const onNodeLabelChange = useCallback((id: string, newLabel: string) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, label: newLabel } } : node
      )
    );
    if (selectedNode && selectedNode.id === id) {
      setSelectedNode(prev => prev ? { ...prev, data: { ...prev.data, label: newLabel } } : null);
    }
  }, [selectedNode]);

  const onSave = useCallback(() => {
    if (nodes.length > 1) {
      const nodesWithEmptyTargets = nodes.filter(node => {
        const incomingEdges = edges.filter(edge => edge.target === node.id);
        return incomingEdges.length === 0;
      });

      if (nodesWithEmptyTargets.length > 1) {
        toast.error("Error: More than one node has an empty target handle.");
        return;
      }
    }
    toast.success("Flow saved successfully!");
    console.log("Nodes:", nodes);
    console.log("Edges:", edges);
  }, [nodes, edges]);

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="flex h-screen w-screen">
      <Toaster position="top-center" reverseOrder={false} />
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
          <div className="settings-panel">
            <h3 className="text-lg font-semibold mb-4">Settings Panel</h3>
            <div className="mb-4">
              <label htmlFor="node-text" className="block text-sm font-medium text-gray-700 mb-1">
                Node Text:
              </label>
              <input
                id="node-text"
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={selectedNode.data.label}
                onChange={(e) => onNodeLabelChange(selectedNode.id, e.target.value)}
              />
            </div>
          </div>
        ) : (
          <div className="nodes-panel">
            <h3 className="text-lg font-semibold mb-4">Nodes Panel</h3>
            <div
              className="dndnode p-4 border border-blue-500 rounded-md cursor-grab bg-white text-blue-500 text-center"
              onDragStart={(event) => onDragStart(event, 'textNode')}
              draggable
            >
              Text Message
            </div>
          </div>
        )}
      </div>
    </div>
  );
}