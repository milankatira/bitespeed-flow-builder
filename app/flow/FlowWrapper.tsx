"use client";

import { ReactFlowProvider } from "reactflow";
import FlowBuilder from "./FlowBuilder";

export default function FlowWrapper() {
  return (
    <ReactFlowProvider>
      <FlowBuilder />
    </ReactFlowProvider>
  );
}
