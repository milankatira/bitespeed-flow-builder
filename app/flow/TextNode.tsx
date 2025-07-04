import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

interface TextNodeProps {
  data: {
    label: string;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  };
  selected: boolean;
}

const TextNode: React.FC<TextNodeProps> = ({ data, selected }) => {
  return (
    <div
      className={`text-node p-4 rounded-md border ${
        selected ? 'border-blue-500' : 'border-gray-300'
      } bg-white shadow-md`}
    >
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-gray-400" />
      <div className="flex flex-col">
        <label htmlFor="text" className="text-sm font-semibold mb-2">
          Text:
        </label>
        <input
          id="text"
          name="text"
          onChange={data.onChange}
          className="nodrag border border-gray-300 rounded-md p-1 text-sm"
          value={data.label}
        />
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-gray-400" />
    </div>
  );
};

export default memo(TextNode);
