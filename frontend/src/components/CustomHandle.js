import { Handle } from '@xyflow/react';
const CustomHandle = ({ type, position, id, style, isConnected }) => {
    const handleStyle = {
      ...style,
      width: '12px',
      height: '12px',
      zIndex : 2,
      borderRadius: '50%',
      border: '1px solid #5A429A',
      background: isConnected ? 'green' : 'white',
    };
  
    return (
      <Handle
        type={type}
        position={position}
        id={id}
        style={handleStyle}
      />
    );
  };

  export default CustomHandle
