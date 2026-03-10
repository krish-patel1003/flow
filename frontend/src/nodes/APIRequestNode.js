import React, { useState } from 'react';
import { BaseNode } from './BaseNode';


export const APIRequestNode = ({ id, data }) => {
  const [method, setMethod] = useState(data.method || 'GET');
  const [url, setUrl] = useState(data.url || '');

  return (
    <BaseNode
      id={id}
      data={data}
      inputHandles={[{ id: 'params' }, { id: 'headers' }]}
      outputHandles={[{ id: 'response' }]}
      heading="API Request"
    >
      <label>
        Method
      </label>
      <select value={method} onChange={(e) => setMethod(e.target.value)}>
        <option value="GET">GET</option>
        <option value="POST">POST</option>
        <option value="PUT">PUT</option>
        <option value="DELETE">DELETE</option>
      </select>
      <label>
        URL
      </label>
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Enter URL"
      />
    </BaseNode>
  );
};